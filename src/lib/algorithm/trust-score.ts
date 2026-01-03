/**
 * Creator Trust Score System
 * Manages shadow-ban logic and creator reputation
 */

import prisma from '@/lib/prisma';
import { TrustScoreFactors } from './types';
import debug from '@/lib/debug';

// Thresholds
const SHADOW_BAN_THRESHOLD = 0.3;
const WARNING_THRESHOLD = 0.5;
const REPORT_WEIGHT_PER_REPORT = 0.05;
const SPAM_SIGNAL_DECAY = 0.9; // Decay per day

/**
 * Initialize trust score for a new creator
 */
export async function initializeCreatorTrustScore(userId: string): Promise<void> {
  try {
    // Check if trust score already exists
    const existing = await prisma.creatorTrustScore.findUnique({
      where: { userId },
    });

    if (existing) {
      debug.log(`[TrustScore] Trust score already exists for user ${userId}`);
      return;
    }

    // Create initial trust score with neutral values
    await prisma.creatorTrustScore.create({
      data: {
        userId,
        originalityScore: 1.0,
        engagementQuality: 1.0,
        spamSignals: 0.0,
        reportWeight: 0.0,
        contentQuality: 1.0,
        trustScore: 1.0, // Start with full trust
        isShadowBanned: false,
      },
    });

    debug.log(`[TrustScore] Initialized trust score for user ${userId}`);
  } catch (error) {
    debug.error('[TrustScore] Failed to initialize trust score:', error);
  }
}

/**
 * Calculate and update creator trust score
 */
export async function updateCreatorTrustScore(userId: string): Promise<void> {
  try {
    // Get existing score or create default
    let trustData = await prisma.creatorTrustScore.findUnique({
      where: { userId },
    });

    const factors: TrustScoreFactors = {
      originalityScore: 1.0,
      engagementQuality: 1.0,
      spamSignals: 0.0,
      reportWeight: 0.0,
      contentQuality: 1.0,
    };

    // 1. Calculate originality score
    // Check for duplicate content (same video hash, watermarks, etc.)
    // For now, we'll use a simple metric based on post diversity
    const recentPosts = await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { attachments: true },
    });

    if (recentPosts.length > 0) {
      // Check for rapid posting (spam signal)
      const postsLastHour = recentPosts.filter(p => {
        const hourAgo = new Date();
        hourAgo.setHours(hourAgo.getHours() - 1);
        return p.createdAt > hourAgo;
      });
      
      if (postsLastHour.length > 5) {
        factors.spamSignals += 0.2; // Posting too fast
      }
    }

    // 2. Calculate engagement quality
    // Check if engagement looks organic vs bot-like
    const postMetrics = await prisma.postMetrics.findMany({
      where: {
        post: { userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (postMetrics.length > 0) {
      // Average completion rate indicates content quality
      const avgCompletion = postMetrics.reduce((sum, m) => sum + m.completionRate, 0) / postMetrics.length;
      factors.contentQuality = avgCompletion;

      // Check for suspicious engagement patterns
      // High likes but low completion = bot-like
      const avgLikeRate = postMetrics.reduce((sum, m) => sum + (m.likeRate || 0), 0) / postMetrics.length;
      const avgSkipRate = postMetrics.reduce((sum, m) => sum + (m.skipRate || 0), 0) / postMetrics.length;

      if (avgLikeRate > 0.3 && avgCompletion < 0.3) {
        factors.engagementQuality = 0.5; // Suspicious pattern
        factors.spamSignals += 0.1;
      } else {
        factors.engagementQuality = Math.min(1, avgCompletion + 0.2);
      }

      // High skip rate = poor content
      if (avgSkipRate > 0.5) {
        factors.contentQuality *= 0.7;
      }
    }

    // 3. Calculate report weight
    const recentReports = await prisma.post_reports.count({
      where: {
        posts: { userId },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const userReports = await prisma.user_reports.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    factors.reportWeight = Math.min(1, (recentReports + userReports) * REPORT_WEIGHT_PER_REPORT);

    // 4. Calculate final trust score
    // Formula: (originality + engagementQuality + contentQuality) / 3 - spamSignals - reportWeight
    const baseScore = (factors.originalityScore + factors.engagementQuality + factors.contentQuality) / 3;
    const trustScore = Math.max(0, Math.min(1, baseScore - factors.spamSignals - factors.reportWeight));

    // Determine shadow ban status
    const isShadowBanned = trustScore < SHADOW_BAN_THRESHOLD;
    let shadowBanReason: string | null = null;
    let shadowBanExpiresAt: Date | null = null;

    if (isShadowBanned) {
      const reasons: string[] = [];
      if (factors.spamSignals > 0.3) reasons.push('Spam-like behavior detected');
      if (factors.reportWeight > 0.3) reasons.push('Multiple reports received');
      if (factors.contentQuality < 0.3) reasons.push('Low content quality');
      if (factors.engagementQuality < 0.5) reasons.push('Suspicious engagement patterns');
      
      shadowBanReason = reasons.join('; ');
      
      // Shadow ban expires in 7 days
      shadowBanExpiresAt = new Date();
      shadowBanExpiresAt.setDate(shadowBanExpiresAt.getDate() + 7);
    }

    // Upsert trust score
    await prisma.creatorTrustScore.upsert({
      where: { userId },
      create: {
        userId,
        originalityScore: factors.originalityScore,
        engagementQuality: factors.engagementQuality,
        spamSignals: factors.spamSignals,
        reportWeight: factors.reportWeight,
        contentQuality: factors.contentQuality,
        trustScore,
        isShadowBanned,
        shadowBanReason,
        shadowBanExpiresAt,
      },
      update: {
        originalityScore: factors.originalityScore,
        engagementQuality: factors.engagementQuality,
        spamSignals: factors.spamSignals,
        reportWeight: factors.reportWeight,
        contentQuality: factors.contentQuality,
        trustScore,
        isShadowBanned,
        shadowBanReason,
        shadowBanExpiresAt,
      },
    });

    debug.log(`[TrustScore] Updated trust score for user ${userId}: ${trustScore.toFixed(3)}, shadowBanned=${isShadowBanned}`);
  } catch (error) {
    debug.error('[TrustScore] Failed to update trust score:', error);
  }
}

/**
 * Check if a creator is shadow banned
 */
export async function isCreatorShadowBanned(userId: string): Promise<boolean> {
  const trustScore = await prisma.creatorTrustScore.findUnique({
    where: { userId },
    select: { isShadowBanned: true, shadowBanExpiresAt: true },
  });

  if (!trustScore) return false;

  // Check if ban has expired
  if (trustScore.isShadowBanned && trustScore.shadowBanExpiresAt) {
    if (new Date() > trustScore.shadowBanExpiresAt) {
      // Ban expired, lift it
      await prisma.creatorTrustScore.update({
        where: { userId },
        data: {
          isShadowBanned: false,
          shadowBanReason: null,
          shadowBanExpiresAt: null,
        },
      });
      return false;
    }
  }

  return trustScore.isShadowBanned;
}

/**
 * Get creator trust score details
 */
export async function getCreatorTrustScore(userId: string) {
  return prisma.creatorTrustScore.findUnique({
    where: { userId },
  });
}

/**
 * Report a post and update creator trust
 */
export async function handlePostReport(postId: string, reporterId: string): Promise<void> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (post) {
      // Update creator trust score
      await updateCreatorTrustScore(post.userId);
    }
  } catch (error) {
    debug.error('[TrustScore] Failed to handle post report:', error);
  }
}

/**
 * Decay spam signals over time
 * Should be run as a daily cron job
 */
export async function decaySpamSignals(): Promise<{ processed: number }> {
  try {
    const trustScores = await prisma.creatorTrustScore.findMany({
      where: {
        spamSignals: { gt: 0 },
      },
    });

    for (const score of trustScores) {
      const newSpamSignals = score.spamSignals * SPAM_SIGNAL_DECAY;
      
      await prisma.creatorTrustScore.update({
        where: { id: score.id },
        data: {
          spamSignals: newSpamSignals,
          // Recalculate trust score
          trustScore: Math.max(0, Math.min(1,
            (score.originalityScore + score.engagementQuality + score.contentQuality) / 3 
            - newSpamSignals 
            - score.reportWeight
          )),
        },
      });
    }

    debug.log(`[TrustScore] Decayed spam signals for ${trustScores.length} users`);
    return { processed: trustScores.length };
  } catch (error) {
    debug.error('[TrustScore] Failed to decay spam signals:', error);
    return { processed: 0 };
  }
}

/**
 * Check expired shadow bans and lift them
 * Should be run as a daily cron job
 */
export async function checkExpiredShadowBans(): Promise<{ expired: number }> {
  try {
    const expiredBans = await prisma.creatorTrustScore.findMany({
      where: {
        isShadowBanned: true,
        shadowBanExpiresAt: { lte: new Date() },
      },
    });

    for (const ban of expiredBans) {
      await prisma.creatorTrustScore.update({
        where: { id: ban.id },
        data: {
          isShadowBanned: false,
          shadowBanReason: null,
          shadowBanExpiresAt: null,
        },
      });
    }

    debug.log(`[TrustScore] Lifted ${expiredBans.length} expired shadow bans`);
    return { expired: expiredBans.length };
  } catch (error) {
    debug.error('[TrustScore] Failed to check expired shadow bans:', error);
    return { expired: 0 };
  }
}
