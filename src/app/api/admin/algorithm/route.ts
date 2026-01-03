/**
 * Admin Algorithm Analytics API
 * Provides insights into the recommendation algorithm performance
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import debug from "@/lib/debug";

/**
 * GET /api/admin/algorithm
 * Get algorithm analytics dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { user } = await validateRequest();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics: Record<string, any> = {};

    // 1. Distribution phase breakdown
    const distributionPhases = await prisma.postMetrics.groupBy({
      by: ['distributionPhase'],
      _count: { postId: true },
    });
    analytics.distributionPhases = distributionPhases.reduce((acc, item) => {
      acc[item.distributionPhase] = item._count.postId;
      return acc;
    }, {} as Record<string, number>);

    // 2. Average viral scores by phase
    const avgViralScores = await prisma.postMetrics.groupBy({
      by: ['distributionPhase'],
      _avg: { viralScore: true },
    });
    analytics.avgViralScores = avgViralScores.reduce((acc, item) => {
      acc[item.distributionPhase] = item._avg.viralScore?.toFixed(3) || 0;
      return acc;
    }, {} as Record<string, string | number>);

    // 3. Shadow banned creators
    const shadowBannedCount = await prisma.creatorTrustScore.count({
      where: { isShadowBanned: true },
    });
    const totalCreators = await prisma.creatorTrustScore.count();
    analytics.shadowBans = {
      active: shadowBannedCount,
      total: totalCreators,
      percentage: totalCreators > 0 ? ((shadowBannedCount / totalCreators) * 100).toFixed(2) + '%' : '0%',
    };

    // 4. Low trust score creators (at risk of shadow ban)
    const lowTrustCreators = await prisma.creatorTrustScore.findMany({
      where: {
        trustScore: { lt: 0.5 },
        isShadowBanned: false,
      },
      orderBy: { trustScore: 'asc' },
      take: 20,
    });
    
    // Get user info separately to avoid relation issues
    const userIds = lowTrustCreators.map(c => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, displayName: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    
    analytics.lowTrustCreators = lowTrustCreators.map(c => {
      const user = userMap.get(c.userId);
      return {
        userId: c.userId,
        username: user?.username || 'Unknown',
        displayName: user?.displayName || user?.username || 'Unknown',
        trustScore: c.trustScore.toFixed(3),
        spamSignals: c.spamSignals.toFixed(3),
        reportWeight: c.reportWeight.toFixed(3),
      };
    });

    // 5. Top performing posts (by viral score)
    const topPosts = await prisma.postMetrics.findMany({
      where: { distributionPhase: { in: ['SCALE', 'BLAST'] } },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { viralScore: 'desc' },
      take: 20,
    });
    analytics.topPosts = topPosts.map(m => ({
      postId: m.postId,
      content: m.post.content.substring(0, 100),
      creator: m.post.user.displayName || m.post.user.username,
      viralScore: m.viralScore.toFixed(3),
      phase: m.distributionPhase,
      totalViews: m.totalViews,
      completionRate: (m.completionRate * 100).toFixed(1) + '%',
    }));

    // 6. Watch event statistics
    const watchEventStats = await prisma.postWatchEvent.aggregate({
      _count: { id: true },
      _avg: {
        watchDuration: true,
        completionRate: true,
      },
    });
    analytics.watchEvents = {
      total: watchEventStats._count.id,
      avgWatchDuration: (watchEventStats._avg.watchDuration?.toFixed(2) || '0') + 's',
      avgCompletionRate: ((watchEventStats._avg.completionRate || 0) * 100).toFixed(1) + '%',
    };

    // 7. Recent watch events (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentWatchCount = await prisma.postWatchEvent.count({
      where: { createdAt: { gte: oneDayAgo } },
    });
    analytics.recentActivity = {
      watchEventsLast24h: recentWatchCount,
    };

    // 8. User interest profiles count
    const interestProfileCount = await prisma.userInterestProfile.count();
    analytics.userProfiles = {
      withInterestProfile: interestProfileCount,
    };

    // 9. Content vectors count
    const contentVectorCount = await prisma.postContentVector.count();
    const totalPosts = await prisma.post.count();
    analytics.contentTagging = {
      taggedPosts: contentVectorCount,
      totalPosts,
      coverage: totalPosts > 0 ? ((contentVectorCount / totalPosts) * 100).toFixed(1) + '%' : '0%',
    };

    // 10. Feed cache stats
    const feedCacheCount = await prisma.userFeedCache.count();
    const expiredCacheCount = await prisma.userFeedCache.count({
      where: { expiresAt: { lt: new Date() } },
    });
    analytics.feedCache = {
      active: feedCacheCount - expiredCacheCount,
      expired: expiredCacheCount,
    };

    debug.log('[Admin] Algorithm analytics retrieved');
    return Response.json(analytics);
  } catch (error) {
    debug.error('[Admin] Algorithm analytics error:', error);
    return Response.json(
      { error: "Failed to get algorithm analytics" },
      { status: 500 }
    );
  }
}
