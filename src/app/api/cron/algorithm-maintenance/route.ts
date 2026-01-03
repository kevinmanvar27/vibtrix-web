/**
 * Algorithm Maintenance Cron Job
 * Runs daily to maintain algorithm health:
 * - Decay user interests toward neutral
 * - Decay spam signals
 * - Check and expire shadow bans
 * - Clean up old watch events
 * 
 * Schedule: Daily at 3:00 AM UTC
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { applyInterestDecay } from "@/lib/algorithm/interest-profiler";
import { decaySpamSignals, checkExpiredShadowBans } from "@/lib/algorithm/trust-score";
import debug from "@/lib/debug";

// Secret key for cron authentication (set in environment)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      debug.log("[Cron] Algorithm maintenance - Unauthorized");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log("[Cron] Starting algorithm maintenance");
    const startTime = Date.now();
    const results: Record<string, any> = {};

    // 1. Apply interest decay to all users
    try {
      await applyInterestDecay();
      const userCount = await prisma.userInterestProfile.count();
      results.interestDecay = { processed: userCount };
      debug.log(`[Cron] Interest decay applied to ${userCount} users`);
    } catch (error) {
      debug.error("[Cron] Interest decay failed:", error);
      results.interestDecay = { error: String(error) };
    }

    // 2. Decay spam signals for creators
    try {
      const decayResult = await decaySpamSignals();
      results.spamDecay = decayResult;
      debug.log(`[Cron] Spam signals decayed for ${decayResult.processed} creators`);
    } catch (error) {
      debug.error("[Cron] Spam decay failed:", error);
      results.spamDecay = { error: String(error) };
    }

    // 3. Check and expire shadow bans
    try {
      const banResult = await checkExpiredShadowBans();
      results.shadowBanExpiry = banResult;
      debug.log(`[Cron] Shadow bans expired for ${banResult.expired} creators`);
    } catch (error) {
      debug.error("[Cron] Shadow ban check failed:", error);
      results.shadowBanExpiry = { error: String(error) };
    }

    // 4. Clean up old watch events (older than 90 days)
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deleteResult = await prisma.postWatchEvent.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      });
      results.watchEventCleanup = { deleted: deleteResult.count };
      debug.log(`[Cron] Deleted ${deleteResult.count} old watch events`);
    } catch (error) {
      debug.error("[Cron] Watch event cleanup failed:", error);
      results.watchEventCleanup = { error: String(error) };
    }

    // 5. Clean up expired feed caches
    try {
      const deleteResult = await prisma.userFeedCache.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      results.feedCacheCleanup = { deleted: deleteResult.count };
      debug.log(`[Cron] Deleted ${deleteResult.count} expired feed caches`);
    } catch (error) {
      debug.error("[Cron] Feed cache cleanup failed:", error);
      results.feedCacheCleanup = { error: String(error) };
    }

    // 6. Recalculate viral scores for posts in TEST phase
    try {
      const testPhasePosts = await prisma.postMetrics.findMany({
        where: { distributionPhase: "TEST" },
        select: { postId: true },
        take: 1000, // Limit to prevent timeout
      });

      // Trigger metrics update for each post (this will recalculate viral scores)
      let recalculatedCount = 0;
      for (const { postId } of testPhasePosts) {
        // Check if post has any watch events
        const hasWatchEvents = await prisma.postWatchEvent.count({
          where: { postId },
        });
        
        if (hasWatchEvents > 0) {
          recalculatedCount++;
        }
      }
      results.viralScoreRecalc = { processed: recalculatedCount };
      debug.log(`[Cron] Checked viral scores for ${recalculatedCount} posts`);
    } catch (error) {
      debug.error("[Cron] Viral score recalculation failed:", error);
      results.viralScoreRecalc = { error: String(error) };
    }

    const duration = Date.now() - startTime;
    debug.log(`[Cron] Algorithm maintenance completed in ${duration}ms`);

    return Response.json({
      success: true,
      duration: `${duration}ms`,
      results,
    });
  } catch (error) {
    debug.error("[Cron] Algorithm maintenance failed:", error);
    return Response.json(
      { error: "Maintenance failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Also support POST for Vercel cron
export async function POST(request: NextRequest) {
  return GET(request);
}
