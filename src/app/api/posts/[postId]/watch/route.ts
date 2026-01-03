/**
 * Watch Event Tracking API
 * Records video watch events for the recommendation algorithm
 */

import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { recordWatchEvent, recordWatchEventsBatch } from "@/lib/algorithm/watch-tracker";
import debug from "@/lib/debug";
import { z } from "zod";

// Schema for single watch event
const watchEventSchema = z.object({
  watchDuration: z.number().min(0),
  totalDuration: z.number().min(0),
  completionRate: z.number().min(0).max(1),
  replayed: z.boolean().optional().default(false),
  replayCount: z.number().min(0).optional().default(0),
  skipped: z.boolean().optional().default(false),
  skipTime: z.number().min(0).optional(),
  source: z.enum(['feed', 'profile', 'explore', 'search', 'share', 'direct']).optional().default('feed'),
  sessionId: z.string().optional(),
});

// Schema for batch watch events
const batchWatchEventsSchema = z.array(z.object({
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
}));

/**
 * POST /api/posts/[postId]/watch
 * Record a single watch event
 */
export async function POST(
  request: NextRequest,
  { params: { postId } }: { params: { postId: string } }
) {
  try {
    debug.log(`POST /api/posts/${postId}/watch - Recording watch event`);
    
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      // For anonymous users, we still want to track but without user ID
      // This helps with overall metrics but not personalization
      debug.log(`POST /api/posts/${postId}/watch - Anonymous user`);
    }

    const body = await request.json();
    const validationResult = watchEventSchema.safeParse(body);

    if (!validationResult.success) {
      debug.log(`POST /api/posts/${postId}/watch - Invalid request body:`, validationResult.error);
      return Response.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate that watch duration doesn't exceed total duration (with small buffer for timing issues)
    if (data.watchDuration > data.totalDuration * 1.1) {
      debug.log(`POST /api/posts/${postId}/watch - Watch duration exceeds total duration`);
      return Response.json(
        { error: "Watch duration cannot exceed total duration" },
        { status: 400 }
      );
    }

    // Record the watch event
    await recordWatchEvent(
      postId,
      user?.id || null,
      {
        watchDuration: data.watchDuration,
        totalDuration: data.totalDuration,
        completionRate: data.completionRate,
        replayed: data.replayed,
        replayCount: data.replayCount,
        skipped: data.skipped,
        skipTime: data.skipTime,
        source: data.source,
        sessionId: data.sessionId,
      }
    );

    debug.log(`POST /api/posts/${postId}/watch - Watch event recorded successfully`);
    
    return Response.json({ success: true });
  } catch (error) {
    debug.error(`POST /api/posts/${postId}/watch - Error:`, error);
    return Response.json(
      { error: "Failed to record watch event" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[postId]/watch
 * Update an existing watch event (for when user continues watching)
 */
export async function PUT(
  request: NextRequest,
  { params: { postId } }: { params: { postId: string } }
) {
  try {
    debug.log(`PUT /api/posts/${postId}/watch - Updating watch event`);
    
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = watchEventSchema.safeParse(body);

    if (!validationResult.success) {
      return Response.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // For updates, we just create a new watch event
    // The algorithm will aggregate them
    await recordWatchEvent(
      postId,
      user.id,
      {
        watchDuration: data.watchDuration,
        totalDuration: data.totalDuration,
        completionRate: data.completionRate,
        replayed: data.replayed,
        replayCount: data.replayCount,
        skipped: data.skipped,
        skipTime: data.skipTime,
        source: data.source,
        sessionId: data.sessionId,
      }
    );

    return Response.json({ success: true });
  } catch (error) {
    debug.error(`PUT /api/posts/${postId}/watch - Error:`, error);
    return Response.json(
      { error: "Failed to update watch event" },
      { status: 500 }
    );
  }
}
