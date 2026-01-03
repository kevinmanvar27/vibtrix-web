/**
 * Feed Ranking Engine
 * Generates personalized feeds using Instagram-like algorithm
 */

import prisma from '@/lib/prisma';
import { 
  PostScore, 
  FeedConfig, 
  DEFAULT_FEED_CONFIG,
  InterestVector 
} from './types';
import { getUserInterests, calculateInterestMatch } from './interest-profiler';
import { isCreatorShadowBanned } from './trust-score';
import debug from '@/lib/debug';

const CACHE_DURATION_MINUTES = 10;

interface RankedPost {
  id: string;
  userId: string;
  createdAt: Date;
  score: number;
  reasons: string[];
}

/**
 * Generate personalized feed for a user
 */
export async function generatePersonalizedFeed(
  userId: string | null,
  options: {
    limit?: number;
    cursor?: string;
    excludePostIds?: string[];
    feedType?: 'for_you' | 'following' | 'explore';
  } = {}
): Promise<{ posts: RankedPost[]; nextCursor: string | null }> {
  const { 
    limit = 10, 
    cursor, 
    excludePostIds = [],
    feedType = 'for_you' 
  } = options;

  try {
    // Check cache first for logged-in users
    if (userId) {
      const cachedFeed = await getCachedFeed(userId, feedType);
      if (cachedFeed) {
        debug.log(`[RankingEngine] Returning cached feed for user ${userId}`);
        return paginateFeed(cachedFeed, cursor, limit);
      }
    }

    // Get user's interests (or default for anonymous)
    const userInterests = userId ? await getUserInterests(userId) : getDefaultInterests();

    // Get user's blocked users
    const blockedUserIds = userId ? await getBlockedUserIds(userId) : [];

    // Get users the current user follows (for following boost)
    const followingIds = userId ? await getFollowingIds(userId) : [];

    // Get "Not Interested" signals
    const notInterestedPostIds = userId ? await getNotInterestedPostIds(userId) : [];
    const hiddenCreatorIds = userId ? await getHiddenCreatorIds(userId) : [];

    // Get candidate posts
    const candidatePosts = await getCandidatePosts({
      excludeUserIds: [...blockedUserIds, ...hiddenCreatorIds],
      excludePostIds: [...excludePostIds, ...notInterestedPostIds],
      feedType,
      followingIds,
      limit: 500, // Get more candidates for ranking
    });

    // Score and rank posts
    const rankedPosts = await rankPosts(
      candidatePosts,
      userInterests,
      followingIds,
      DEFAULT_FEED_CONFIG
    );

    // Apply distribution phase filtering
    const filteredPosts = await filterByDistributionPhase(rankedPosts, feedType);

    // Cache the feed for logged-in users
    if (userId) {
      await cacheFeed(userId, filteredPosts, feedType);
    }

    return paginateFeed(filteredPosts, cursor, limit);
  } catch (error) {
    debug.error('[RankingEngine] Failed to generate feed:', error);
    throw error;
  }
}

/**
 * Get candidate posts for ranking
 */
async function getCandidatePosts(options: {
  excludeUserIds: string[];
  excludePostIds: string[];
  feedType: string;
  followingIds: string[];
  limit: number;
}): Promise<any[]> {
  const { excludeUserIds, excludePostIds, feedType, followingIds, limit } = options;

  // Base query conditions
  const whereConditions: any = {
    userId: { notIn: excludeUserIds },
    id: { notIn: excludePostIds },
    user: {
      role: 'USER',
      isActive: true,
      OR: [
        { isProfilePublic: true },
        ...(followingIds.length > 0 ? [{ id: { in: followingIds } }] : []),
      ],
    },
    // Exclude competition-only posts
    OR: [
      { competitionEntries: { none: {} } },
      { competitionEntries: { some: { visibleInNormalFeed: true } } },
    ],
  };

  // For "following" feed, only show posts from followed users
  if (feedType === 'following' && followingIds.length > 0) {
    whereConditions.userId = { in: followingIds, notIn: excludeUserIds };
  }

  // Get posts with metrics
  const posts = await prisma.post.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      attachments: true,
      metrics: true,
      contentVector: true,
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
          bookmarks: true,
          views: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return posts;
}

/**
 * Rank posts based on user interests and engagement
 */
async function rankPosts(
  posts: any[],
  userInterests: InterestVector,
  followingIds: string[],
  config: FeedConfig
): Promise<RankedPost[]> {
  const rankedPosts: RankedPost[] = [];

  for (const post of posts) {
    const reasons: string[] = [];
    let score = 0;

    // 1. Interest matching (70% weight)
    if (post.contentVector?.tags) {
      const interestScore = calculateInterestMatch(
        userInterests,
        post.contentVector.tags as Record<string, number>
      );
      score += interestScore * config.interestWeight;
      if (interestScore > 0.7) {
        reasons.push('Matches your interests');
      }
    }

    // 2. Engagement score (from metrics)
    if (post.metrics) {
      const engagementScore = post.metrics.viralScore || 0;
      score += engagementScore * 0.2;
      if (engagementScore > 0.5) {
        reasons.push('Popular content');
      }
    }

    // 3. Following boost
    if (followingIds.includes(post.userId)) {
      score *= config.followingBoost;
      reasons.push('From someone you follow');
    }

    // 4. Freshness decay
    const ageInDays = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const freshnessMultiplier = Math.pow(config.freshnessDecay, ageInDays);
    score *= freshnessMultiplier;

    // 5. Check shadow ban (reduce visibility significantly)
    const isBanned = await isCreatorShadowBanned(post.userId);
    if (isBanned) {
      score *= 0.1; // 90% reduction for shadow-banned creators
    }

    // 6. Add some randomness for exploration
    const randomFactor = 1 + (Math.random() - 0.5) * config.randomWeight;
    score *= randomFactor;

    rankedPosts.push({
      id: post.id,
      userId: post.userId,
      createdAt: post.createdAt,
      score,
      reasons,
    });
  }

  // Sort by score descending
  rankedPosts.sort((a, b) => b.score - a.score);

  return rankedPosts;
}

/**
 * Filter posts by distribution phase
 */
async function filterByDistributionPhase(
  posts: RankedPost[],
  feedType: string
): Promise<RankedPost[]> {
  if (feedType === 'following') {
    // Don't filter following feed by distribution phase
    return posts;
  }

  // For explore/for_you, prioritize content in SCALE or BLAST phase
  const postIds = posts.map(p => p.id);
  const metrics = await prisma.postMetrics.findMany({
    where: { postId: { in: postIds } },
    select: { postId: true, distributionPhase: true },
  });

  const phaseMap = new Map(metrics.map(m => [m.postId, m.distributionPhase]));

  return posts.filter(post => {
    const phase = phaseMap.get(post.id);
    
    // Allow all phases for now, but boost SCALE and BLAST
    if (phase === 'KILLED') {
      // Reduce visibility of killed content
      post.score *= 0.3;
    } else if (phase === 'BLAST') {
      post.score *= 1.5;
    } else if (phase === 'SCALE') {
      post.score *= 1.2;
    }
    
    return true;
  }).sort((a, b) => b.score - a.score);
}

/**
 * Paginate feed results
 */
function paginateFeed(
  posts: RankedPost[],
  cursor: string | undefined,
  limit: number
): { posts: RankedPost[]; nextCursor: string | null } {
  let startIndex = 0;

  if (cursor) {
    const cursorIndex = posts.findIndex(p => p.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  const paginatedPosts = posts.slice(startIndex, startIndex + limit + 1);
  const hasMore = paginatedPosts.length > limit;
  const resultPosts = paginatedPosts.slice(0, limit);
  const nextCursor = hasMore ? resultPosts[resultPosts.length - 1]?.id : null;

  return { posts: resultPosts, nextCursor };
}

/**
 * Cache feed for a user
 */
async function cacheFeed(
  userId: string,
  posts: RankedPost[],
  feedType: string
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CACHE_DURATION_MINUTES);

    await prisma.userFeedCache.upsert({
      where: { userId },
      create: {
        userId,
        feed: posts.map(p => ({ postId: p.id, score: p.score, reasons: p.reasons })),
        feedType,
        expiresAt,
      },
      update: {
        feed: posts.map(p => ({ postId: p.id, score: p.score, reasons: p.reasons })),
        feedType,
        generatedAt: new Date(),
        expiresAt,
      },
    });
  } catch (error) {
    debug.error('[RankingEngine] Failed to cache feed:', error);
  }
}

/**
 * Get cached feed for a user
 */
async function getCachedFeed(
  userId: string,
  feedType: string
): Promise<RankedPost[] | null> {
  try {
    const cache = await prisma.userFeedCache.findUnique({
      where: { userId },
    });

    if (!cache || cache.feedType !== feedType) return null;
    if (new Date() > cache.expiresAt) return null;

    const feedData = cache.feed as Array<{ postId: string; score: number; reasons: string[] }>;
    
    // Verify posts still exist
    const postIds = feedData.map(f => f.postId);
    const existingPosts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, userId: true, createdAt: true },
    });

    const existingPostMap = new Map(existingPosts.map(p => [p.id, p]));

    return feedData
      .filter(f => existingPostMap.has(f.postId))
      .map(f => ({
        id: f.postId,
        userId: existingPostMap.get(f.postId)!.userId,
        createdAt: existingPostMap.get(f.postId)!.createdAt,
        score: f.score,
        reasons: f.reasons,
      }));
  } catch (error) {
    debug.error('[RankingEngine] Failed to get cached feed:', error);
    return null;
  }
}

/**
 * Invalidate feed cache for a user
 */
export async function invalidateFeedCache(userId: string): Promise<void> {
  try {
    await prisma.userFeedCache.delete({
      where: { userId },
    }).catch(() => {}); // Ignore if doesn't exist
  } catch (error) {
    debug.error('[RankingEngine] Failed to invalidate cache:', error);
  }
}

// Helper functions

function getDefaultInterests(): InterestVector {
  return {
    dance: 0.5,
    music: 0.5,
    comedy: 0.5,
    fashion: 0.5,
    beauty: 0.5,
    fitness: 0.5,
    food: 0.5,
    travel: 0.5,
    tech: 0.5,
    gaming: 0.5,
    education: 0.5,
    news: 0.5,
    sports: 0.5,
    art: 0.5,
    pets: 0.5,
    lifestyle: 0.5,
    motivation: 0.5,
    business: 0.5,
    entertainment: 0.5,
    other: 0.5,
  };
}

async function getBlockedUserIds(userId: string): Promise<string[]> {
  const [blocked, blockedBy] = await Promise.all([
    prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);

  return [...blocked.map(b => b.blockedId), ...blockedBy.map(b => b.blockerId)];
}

async function getFollowingIds(userId: string): Promise<string[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  return following.map(f => f.followingId);
}

async function getNotInterestedPostIds(userId: string): Promise<string[]> {
  const preferences = await prisma.userContentPreference.findMany({
    where: {
      userId,
      type: 'NOT_INTERESTED',
      postId: { not: null },
    },
    select: { postId: true },
  });

  return preferences.map(p => p.postId!);
}

async function getHiddenCreatorIds(userId: string): Promise<string[]> {
  const preferences = await prisma.userContentPreference.findMany({
    where: {
      userId,
      type: 'HIDE_CREATOR',
      creatorId: { not: null },
    },
    select: { creatorId: true },
  });

  return preferences.map(p => p.creatorId!);
}

/**
 * Mark content as "Not Interested"
 */
export async function markNotInterested(
  userId: string,
  postId: string
): Promise<void> {
  await prisma.userContentPreference.upsert({
    where: {
      userId_postId: { userId, postId },
    },
    create: {
      userId,
      postId,
      type: 'NOT_INTERESTED',
    },
    update: {
      type: 'NOT_INTERESTED',
    },
  });

  // Invalidate feed cache
  await invalidateFeedCache(userId);
}

/**
 * Hide a creator's content
 */
export async function hideCreator(
  userId: string,
  creatorId: string
): Promise<void> {
  await prisma.userContentPreference.create({
    data: {
      userId,
      creatorId,
      type: 'HIDE_CREATOR',
    },
  });

  // Invalidate feed cache
  await invalidateFeedCache(userId);
}
