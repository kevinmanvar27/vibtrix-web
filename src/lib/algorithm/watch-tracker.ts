/**
 * Watch Event Tracker
 * Tracks user watch behavior for algorithm training
 */

import prisma from '@/lib/prisma';
import { WatchEventData } from './types';
import { updateUserInterests } from './interest-profiler';
import debug from '@/lib/debug';

/**
 * Record a watch event for a post
 * This is the MOST IMPORTANT data for the algorithm
 * 
 * @param postId - The post being watched
 * @param userId - The user watching (null for anonymous)
 * @param eventData - Watch event details
 */
export async function recordWatchEvent(
  postId: string,
  userId: string | null,
  eventData: {
    watchDuration: number;
    totalDuration: number;
    completionRate: number;
    replayed?: boolean;
    replayCount?: number;
    skipped?: boolean;
    skipTime?: number;
    source?: string;
    sessionId?: string;
  }
): Promise<void> {
  try {
    // Calculate completion rate if not provided
    const completionRate = eventData.completionRate ?? 
      (eventData.totalDuration > 0 ? eventData.watchDuration / eventData.totalDuration : 0);

    // Determine if skipped in first 2 seconds
    const skippedInFirst2s = eventData.skipped && (eventData.skipTime ?? eventData.watchDuration) < 2;

    await prisma.postWatchEvent.create({
      data: {
        postId,
        userId: userId || null,
        watchDuration: eventData.watchDuration,
        totalDuration: eventData.totalDuration,
        completionRate: Math.min(completionRate, 1), // Cap at 100%
        replayCount: eventData.replayCount || 0,
        skippedInFirst2s: skippedInFirst2s || false,
        pauseCount: 0,
        deviceType: null,
        source: eventData.source || null,
      },
    });

    debug.log(`[WatchTracker] Recorded watch event for post ${postId}`);

    // Update user interests if logged in
    if (userId) {
      updateUserInterests(userId, postId, completionRate, eventData.replayed || false).catch(err =>
        debug.error('[WatchTracker] Failed to update user interests:', err)
      );
    }

    // Trigger async metrics update (don't await)
    updatePostMetricsAsync(postId).catch(err => 
      debug.error('[WatchTracker] Failed to update metrics:', err)
    );

  } catch (error) {
    debug.error('[WatchTracker] Failed to record watch event:', error);
    throw error;
  }
}

/**
 * Record multiple watch events in batch
 * Useful for mobile apps that batch events
 */
export async function recordWatchEventsBatch(events: WatchEventData[]): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  try {
    const data = events.map(event => ({
      postId: event.postId,
      userId: event.userId || null,
      watchDuration: event.watchDuration,
      totalDuration: event.totalDuration,
      completionRate: Math.min(
        event.completionRate ?? (event.totalDuration > 0 ? event.watchDuration / event.totalDuration : 0),
        1
      ),
      replayCount: event.replayCount || 0,
      skippedInFirst2s: event.skippedInFirst2s ?? (event.watchDuration < 2),
      pauseCount: event.pauseCount || 0,
      deviceType: event.deviceType || null,
      source: event.source || null,
    }));

    const result = await prisma.postWatchEvent.createMany({ data });
    processed = result.count;

    // Get unique post IDs and update their metrics
    const uniquePostIds = [...new Set(events.map(e => e.postId))];
    for (const postId of uniquePostIds) {
      updatePostMetricsAsync(postId).catch(err => 
        debug.error(`[WatchTracker] Failed to update metrics for ${postId}:`, err)
      );
    }

    // Update user interests for logged-in users
    const userEvents = events.filter(e => e.userId);
    for (const event of userEvents) {
      updateUserInterests(
        event.userId!,
        event.postId,
        event.completionRate,
        (event.replayCount || 0) > 0
      ).catch(err =>
        debug.error('[WatchTracker] Failed to update user interests:', err)
      );
    }

    debug.log(`[WatchTracker] Recorded ${processed} watch events in batch`);
  } catch (error) {
    debug.error('[WatchTracker] Failed to record batch watch events:', error);
    failed = events.length - processed;
  }

  return { processed, failed };
}

/**
 * Update post metrics asynchronously
 * Called after watch events are recorded
 */
async function updatePostMetricsAsync(postId: string): Promise<void> {
  try {
    // Get watch events from last 7 days for this post
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const watchEvents = await prisma.postWatchEvent.findMany({
      where: {
        postId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    if (watchEvents.length === 0) return;

    // Calculate metrics
    const totalViews = watchEvents.length;
    const uniqueUserIds = new Set(watchEvents.filter(e => e.userId).map(e => e.userId));
    const uniqueViews = uniqueUserIds.size || totalViews;

    const avgWatchTime = watchEvents.reduce((sum, e) => sum + e.watchDuration, 0) / totalViews;
    const avgCompletionRate = watchEvents.reduce((sum, e) => sum + e.completionRate, 0) / totalViews;
    
    const replays = watchEvents.filter(e => e.replayCount > 0).length;
    const replayRate = replays / totalViews;

    const skips = watchEvents.filter(e => e.skippedInFirst2s).length;
    const skipRate = skips / totalViews;

    // Get engagement counts
    const [likeCount, commentCount, shareCount, saveCount] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      prisma.comment.count({ where: { postId } }),
      prisma.share.count({ where: { postId } }),
      prisma.bookmark.count({ where: { postId } }),
    ]);

    // Calculate rates (per view)
    const likeRate = uniqueViews > 0 ? likeCount / uniqueViews : 0;
    const commentRate = uniqueViews > 0 ? commentCount / uniqueViews : 0;
    const shareRate = uniqueViews > 0 ? shareCount / uniqueViews : 0;
    const saveRate = uniqueViews > 0 ? saveCount / uniqueViews : 0;

    // Calculate viral score
    // Formula: completionRate * 0.4 + replayRate * 0.3 + saveRate * 0.2 + shareRate * 0.1
    const viralScore = 
      avgCompletionRate * 0.4 +
      replayRate * 0.3 +
      saveRate * 0.2 +
      shareRate * 0.1;

    // Determine distribution phase based on performance
    let distributionPhase: 'TEST' | 'SCALE' | 'BLAST' | 'KILLED' = 'TEST';
    
    const existingMetrics = await prisma.postMetrics.findUnique({
      where: { postId },
      select: { distributionPhase: true, testBatchSize: true },
    });

    if (existingMetrics) {
      const currentPhase = existingMetrics.distributionPhase;
      
      if (currentPhase === 'TEST') {
        if (totalViews >= 100) {
          // Evaluate test phase
          if (avgCompletionRate >= 0.6 && skipRate < 0.3) {
            distributionPhase = 'SCALE';
          } else if (avgCompletionRate < 0.3 || skipRate > 0.5) {
            distributionPhase = 'KILLED';
          }
        }
      } else if (currentPhase === 'SCALE') {
        if (totalViews >= 5000) {
          if (avgCompletionRate >= 0.7 && viralScore >= 0.5) {
            distributionPhase = 'BLAST';
          }
        } else {
          distributionPhase = 'SCALE';
        }
      } else {
        distributionPhase = currentPhase as typeof distributionPhase;
      }
    }

    // Upsert metrics
    await prisma.postMetrics.upsert({
      where: { postId },
      create: {
        postId,
        totalViews,
        uniqueViews,
        avgWatchTime,
        completionRate: avgCompletionRate,
        replayRate,
        likeRate,
        commentRate,
        shareRate,
        saveRate,
        skipRate,
        viralScore,
        distributionPhase,
        testBatchSize: totalViews,
        testBatchEngagement: avgCompletionRate,
        lastCalculatedAt: new Date(),
      },
      update: {
        totalViews,
        uniqueViews,
        avgWatchTime,
        completionRate: avgCompletionRate,
        replayRate,
        likeRate,
        commentRate,
        shareRate,
        saveRate,
        skipRate,
        viralScore,
        distributionPhase,
        testBatchSize: totalViews,
        testBatchEngagement: avgCompletionRate,
        lastCalculatedAt: new Date(),
      },
    });

    debug.log(`[WatchTracker] Updated metrics for post ${postId}: viralScore=${viralScore.toFixed(3)}, phase=${distributionPhase}`);
  } catch (error) {
    debug.error(`[WatchTracker] Failed to update metrics for post ${postId}:`, error);
  }
}

/**
 * Get watch statistics for a post
 */
export async function getPostWatchStats(postId: string) {
  const metrics = await prisma.postMetrics.findUnique({
    where: { postId },
  });

  return metrics;
}
