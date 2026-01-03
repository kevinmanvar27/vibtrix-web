/**
 * Batch Watch Event Tracking API
 * Records multiple watch events at once (for mobile apps with offline support)
 */

import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { recordWatchEventsBatch } from "@/lib/algorithm/watch-tracker";
import debug from "@/lib/debug";
import { z } from "zod";

// Schema for batch watch events
const batchWatchEventsSchema = z.object({
  events: z.array(z.object({
    postId: z.string(),
    watchDuration: z.number().min(0),
    totalDuration: z.number().min(0),
    completionRate: z.number().min(0).max(1),
    replayed: z.boolean().optional().default(false),
    replayCount: z.number().min(0).optional().default(0),
    skipped: z.boolean().optional().default(false),
    skipTime: z.number().min(0).optional(),
    source: z.enum(['feed', 'profile', 'explore', 'search', 'share', 'direct']).optional().default('feed'),
    sessionId: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  })).max(100), // Limit to 100 events per batch
});

/**
 * POST /api/posts/watch-batch
 * Record multiple watch events at once
 */
export async function POST(request: NextRequest) {
  try {
    debug.log(`POST /api/posts/watch-batch - Recording batch watch events`);
    
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = batchWatchEventsSchema.safeParse(body);

    if (!validationResult.success) {
      debug.log(`POST /api/posts/watch-batch - Invalid request body:`, validationResult.error);
      return Response.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { events } = validationResult.data;

    if (events.length === 0) {
      return Response.json({ success: true, processed: 0 });
    }

    // Transform events to WatchEventData format
    const watchEvents = events.map(e => ({
      postId: e.postId,
      userId: user.id,
      watchDuration: e.watchDuration,
      totalDuration: e.totalDuration,
      completionRate: e.completionRate,
      replayCount: e.replayCount || 0,
      skippedInFirst2s: e.skipped && (e.skipTime ?? e.watchDuration) < 2,
      pauseCount: 0,
      source: e.source as 'feed' | 'explore' | 'profile' | 'share' | undefined,
    }));

    // Process batch
    const result = await recordWatchEventsBatch(watchEvents);

    debug.log(`POST /api/posts/watch-batch - Processed ${result.processed} events`);
    
    return Response.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
    });
  } catch (error) {
    debug.error(`POST /api/posts/watch-batch - Error:`, error);
    return Response.json(
      { error: "Failed to record batch watch events" },
      { status: 500 }
    );
  }
}
