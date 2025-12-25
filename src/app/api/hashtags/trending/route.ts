import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import { NextRequest } from "next/server";

/**
 * Helper function to get authenticated user from JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // First try JWT authentication (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

interface TrendingHashtag {
  hashtag: string;
  count: number;
  recentPosts: number; // Posts in the last 24 hours
}

interface TrendingHashtagsResponse {
  hashtags: TrendingHashtag[];
  period: string;
}

/**
 * Extract hashtags from text content
 * Matches #hashtag patterns (alphanumeric and underscores)
 */
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const matches = content.match(hashtagRegex) || [];
  // Normalize to lowercase for consistent counting
  return matches.map(tag => tag.toLowerCase());
}

/**
 * GET /api/hashtags/trending
 * Get trending hashtags based on post usage
 * 
 * Query params:
 * - limit: Number of hashtags to return (default: 10, max: 50)
 * - period: Time period for trending calculation ('24h', '7d', '30d', 'all') - default: '7d'
 */
export async function GET(req: NextRequest) {
  try {
    // Auth is optional for this endpoint (public data)
    await getAuthenticatedUser(req);

    // Parse query parameters
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const period = url.searchParams.get("period") || "7d";
    const limit = Math.min(Math.max(parseInt(limitParam || "10", 10), 1), 50);

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | null = null;
    
    switch (period) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = null;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch posts within the time period
    const posts = await prisma.post.findMany({
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
        // Only include posts from active users
        user: {
          isActive: true,
        },
      },
      select: {
        content: true,
        createdAt: true,
      },
    });

    // Count hashtag occurrences
    const hashtagCounts = new Map<string, { total: number; recent: number }>();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const post of posts) {
      const hashtags = extractHashtags(post.content);
      const isRecent = post.createdAt >= twentyFourHoursAgo;
      
      for (const hashtag of hashtags) {
        const current = hashtagCounts.get(hashtag) || { total: 0, recent: 0 };
        current.total += 1;
        if (isRecent) {
          current.recent += 1;
        }
        hashtagCounts.set(hashtag, current);
      }
    }

    // Sort by total count and get top hashtags
    const sortedHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => {
        // Primary sort by total count
        if (b[1].total !== a[1].total) {
          return b[1].total - a[1].total;
        }
        // Secondary sort by recent count (for tiebreaker)
        return b[1].recent - a[1].recent;
      })
      .slice(0, limit)
      .map(([hashtag, counts]) => ({
        hashtag,
        count: counts.total,
        recentPosts: counts.recent,
      }));

    const response: TrendingHashtagsResponse = {
      hashtags: sortedHashtags,
      period,
    };

    return Response.json(response);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
