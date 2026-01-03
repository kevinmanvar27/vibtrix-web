import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { autoTagPost } from "@/lib/algorithm/interest-profiler";
import { initializeCreatorTrustScore } from "@/lib/algorithm/trust-score";

/**
 * POST /api/posts
 * Create a new post
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Request body:
 * - content: string - The post content (required)
 * - mediaIds: string[] - Array of media attachment IDs (optional, defaults to [])
 * 
 * Returns: The created post object with all relations
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    // Validate input
    const validationResult = createPostSchema.safeParse({
      content: body.content || "",
      mediaIds: body.mediaIds || [],
    });

    if (!validationResult.success) {
      return Response.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { content, mediaIds } = validationResult.data;

    // Verify all media IDs exist
    if (mediaIds.length > 0) {
      const mediaCount = await prisma.media.count({
        where: {
          id: { in: mediaIds },
        },
      });

      if (mediaCount !== mediaIds.length) {
        return Response.json(
          { error: "One or more media attachments not found" },
          { status: 400 }
        );
      }
    }

    // Create the post
    const newPost = await prisma.post.create({
      data: {
        content,
        userId: user.id,
        attachments: {
          connect: mediaIds.map((id) => ({ id })),
        },
      },
      include: getPostDataInclude(user.id),
    });

    debug.log(`POST /api/posts - Created post ${newPost.id} for user ${user.id}`);

    // Auto-tag the post for the recommendation algorithm (async, non-blocking)
    autoTagPost(newPost.id, content).catch(err => {
      debug.error(`Failed to auto-tag post ${newPost.id}:`, err);
    });

    // Initialize creator trust score if this is their first post (async, non-blocking)
    initializeCreatorTrustScore(user.id).catch(err => {
      debug.error(`Failed to initialize trust score for user ${user.id}:`, err);
    });

    // Create initial post metrics for distribution tracking (async, non-blocking)
    prisma.postMetrics.create({
      data: {
        postId: newPost.id,
        viralScore: 0,
        distributionPhase: 'TEST',
        totalViews: 0,
        uniqueViews: 0,
        avgWatchTime: 0,
        completionRate: 0,
        replayRate: 0,
        saveRate: 0,
        shareRate: 0,
        skipRate: 0,
      },
    }).catch(err => {
      debug.error(`Failed to create post metrics for ${newPost.id}:`, err);
    });

    return Response.json(newPost, { status: 201 });
  } catch (error) {
    debug.error("Error creating post:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
