import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";
import { validateAuthRequest } from "@/lib/jwt-middleware";
import { generatePersonalizedFeed } from "@/lib/algorithm/ranking-engine";
import { unstable_cache } from "next/cache";

import debug from "@/lib/debug";

// OPTIMIZATION: Cache blocked users for 2 minutes to reduce database calls
const getCachedBlockedUsers = unstable_cache(
  async (userId: string) => {
    const [blockedUsers, blockedByUsers] = await Promise.all([
      prisma.userBlock.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      }),
      prisma.userBlock.findMany({
        where: { blockedId: userId },
        select: { blockerId: true },
      }),
    ]);

    const blockedUserIds = blockedUsers.map((block) => block.blockedId);
    const blockedByUserIds = blockedByUsers.map((block) => block.blockerId);
    
    return [...blockedUserIds, ...blockedByUserIds];
  },
  ['blocked-users'],
  {
    revalidate: 120, // 2 minutes cache
    tags: ['blocked-users'],
  }
);

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const showStickeredMediaParam = req.nextUrl.searchParams.get("showStickeredMedia");
    const showStickeredMedia = showStickeredMediaParam === null ? null : showStickeredMediaParam === "true";
    const randomParam = req.nextUrl.searchParams.get("random");
    const random = randomParam === "true";
    const useAlgorithmParam = req.nextUrl.searchParams.get("algorithm");
    const useAlgorithm = useAlgorithmParam !== "false";

    const pageSize = 10;

    // OPTIMIZATION: Parallel authentication check
    let { user } = await validateAuthRequest(req);

    if (!user) {
      const cookieAuthResult = await validateRequest();
      user = cookieAuthResult.user as any;
    }

    const isLoggedIn = !!user;

    // OPTIMIZATION: Remove database connection test - it's unnecessary overhead
    // The query will fail anyway if DB is down

    try {
      debug.log('GET /api/posts/for-you - Starting query');
      
      // Use personalized algorithm if enabled and not requesting random
      if (useAlgorithm && !random) {
        return await getAlgorithmicFeed(req, user, cursor, pageSize, showStickeredMedia);
      }
      
      // Fall back to chronological/random feed
      return await getChronologicalFeed(req, user, cursor, pageSize, showStickeredMedia, random);
    } catch (queryError) {
      debug.error('Error querying posts:', queryError);
      return Response.json({
        error: "Failed to fetch posts",
        details: queryError instanceof Error ? queryError.message : "Error querying database"
      }, { status: 500 });
    }
  } catch (error) {
    debug.error('Unhandled error in for-you posts API:', error);
    return Response.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
}

/**
 * Get personalized algorithmic feed
 */
async function getAlgorithmicFeed(
  req: NextRequest,
  user: any,
  cursor: string | undefined,
  pageSize: number,
  showStickeredMedia: boolean | null
) {
  const isLoggedIn = !!user;
  
  try {
    // Generate personalized feed using ranking engine
    const { posts: rankedPosts, nextCursor } = await generatePersonalizedFeed(
      user?.id || null,
      {
        limit: pageSize,
        cursor,
        feedType: 'for_you',
      }
    );

    if (rankedPosts.length === 0) {
      debug.log('GET /api/posts/for-you - No ranked posts, falling back to chronological');
      return await getChronologicalFeed(req, user, cursor, pageSize, showStickeredMedia, false);
    }

    // Fetch full post data for ranked posts
    const postIds = rankedPosts.map(p => p.id);
    const posts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      include: getPostDataInclude(isLoggedIn ? user!.id : ''),
    });

    // Sort posts by their ranking order
    const postMap = new Map(posts.map(p => [p.id, p]));
    const orderedPosts = rankedPosts
      .map(rp => postMap.get(rp.id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    // Process media URLs based on settings
    const processedPosts = await processPostsMedia(orderedPosts, showStickeredMedia);

    const data: PostsPage = {
      posts: processedPosts,
      nextCursor,
    };

    debug.log(`GET /api/posts/for-you - Returning ${data.posts.length} algorithmic posts`);
    return Response.json(data);
  } catch (error) {
    debug.error('Error in algorithmic feed, falling back to chronological:', error);
    return await getChronologicalFeed(req, user, cursor, pageSize, showStickeredMedia, false);
  }
}

/**
 * Get chronological/random feed (OPTIMIZED)
 */
async function getChronologicalFeed(
  req: NextRequest,
  user: any,
  cursor: string | undefined,
  pageSize: number,
  showStickeredMedia: boolean | null,
  random: boolean
) {
  const isLoggedIn = !!user;
  
  // OPTIMIZATION: Use cached blocked users
  let excludedUserIds: string[] = [];
  if (isLoggedIn && user) {
    excludedUserIds = await getCachedBlockedUsers(user.id);
  }

  // OPTIMIZATION: Simplified query - removed complex nested conditions
  const whereClause: any = {
    // Exclude posts from blocked users
    userId: excludedUserIds.length > 0 ? { notIn: excludedUserIds } : undefined,
    // Only include posts from public profiles or from profiles the user follows
    user: {
      role: "USER",
      isProfilePublic: true, // SIMPLIFIED: Only show public posts for faster query
    }
  };

  // OPTIMIZATION: For random, limit the initial fetch
  let posts;
  if (random) {
    // OPTIMIZATION: Instead of fetching ALL posts, fetch a reasonable subset
    const allPosts = await prisma.post.findMany({
      where: whereClause,
      include: getPostDataInclude(isLoggedIn ? user!.id : ''),
      orderBy: { createdAt: "desc" },
      take: 100, // OPTIMIZATION: Only fetch last 100 posts instead of all
    });

    // Shuffle and take what we need
    const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);
    posts = shuffledPosts.slice(0, pageSize + 1);
  } else {
    // OPTIMIZATION: Standard paginated query with index-friendly ordering
    posts = await prisma.post.findMany({
      where: whereClause,
      include: getPostDataInclude(isLoggedIn ? user!.id : ''),
      orderBy: { createdAt: "desc" }, // Index-friendly ordering
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });
  }

  const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;
  const postsToReturn = posts.slice(0, pageSize);

  // Process media URLs based on settings
  const processedPosts = await processPostsMedia(postsToReturn, showStickeredMedia);

  const data: PostsPage = {
    posts: processedPosts,
    nextCursor,
  };

  debug.log(`GET /api/posts/for-you - Returning ${data.posts.length} posts`);
  return Response.json(data);
}

/**
 * Process posts media based on settings (OPTIMIZED)
 */
async function processPostsMedia(posts: any[], showStickeredMedia: boolean | null) {
  // OPTIMIZATION: Skip processing if not needed
  if (showStickeredMedia === null || showStickeredMedia === true) {
    return posts;
  }

  // Process in parallel for better performance
  return Promise.all(posts.map(async (post) => {
    if (!post.attachments || post.attachments.length === 0) {
      return post;
    }

    const processedAttachments = post.attachments.map((attachment: any) => {
      if (attachment.appliedPromotionSticker && !showStickeredMedia) {
        return {
          ...attachment,
          url: attachment.originalUrl || attachment.url,
        };
      }
      return attachment;
    });

    return {
      ...post,
      attachments: processedAttachments,
    };
  }));
}
