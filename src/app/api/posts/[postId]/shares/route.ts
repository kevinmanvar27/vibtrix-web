/**
 * API route for post shares
 * POST /api/posts/{postId}/shares - Record a share
 * GET /api/posts/{postId}/shares - Get share count
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

/**
 * POST /api/posts/{postId}/shares
 * Record a share action for a post
 */
export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    debug.log(`POST /api/posts/${postId}/shares - Starting request`);

    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      debug.log(`POST /api/posts/${postId}/shares - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if sharing feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { sharingEnabled: true },
    });

    if (!settings?.sharingEnabled) {
      debug.log(`POST /api/posts/${postId}/shares - Sharing disabled`);
      return Response.json({ error: "Sharing feature is currently disabled" }, { status: 403 });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!post) {
      debug.log(`POST /api/posts/${postId}/shares - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Parse optional platform from request body
    let platform: string | undefined;
    try {
      const body = await req.json();
      platform = body.platform;
    } catch {
      // Body is optional
    }

    // Record the share in the database
    try {
      // Use upsert to handle duplicate shares (update timestamp if already shared)
      await prisma.share.upsert({
        where: {
          postId_userId: {
            postId,
            userId: loggedInUser.id,
          },
        },
        create: {
          postId,
          userId: loggedInUser.id,
          platform,
        },
        update: {
          platform,
          createdAt: new Date(), // Update timestamp on re-share
        },
      });

      debug.log(`POST /api/posts/${postId}/shares - Share recorded`);

      // If the post is not by the current user, create a notification
      if (post.userId !== loggedInUser.id) {
        // Check if a share notification already exists recently (within 24 hours)
        const recentNotification = await prisma.notification.findFirst({
          where: {
            type: "SHARE",
            issuerId: loggedInUser.id,
            recipientId: post.userId,
            postId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!recentNotification) {
          await prisma.notification.create({
            data: {
              type: "SHARE",
              issuerId: loggedInUser.id,
              recipientId: post.userId,
              postId,
            },
          });
          debug.log(`POST /api/posts/${postId}/shares - Notification created`);
        }
      }

      // Get updated share count
      const shareCount = await prisma.share.count({
        where: { postId },
      });

      return Response.json({ 
        success: true,
        shareCount,
      });

    } catch (error) {
      debug.error(`POST /api/posts/${postId}/shares - Error recording share:`, error);
      // Still return success to the client as the share intent was received
      return Response.json({ success: true });
    }

  } catch (error) {
    debug.error(`POST /api/posts/${postId}/shares - Error:`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/posts/{postId}/shares
 * Get share count and check if current user has shared
 */
export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    debug.log(`GET /api/posts/${postId}/shares - Starting request`);

    const loggedInUser = await getAuthenticatedUser(req);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      debug.log(`GET /api/posts/${postId}/shares - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Get share count
    const shareCount = await prisma.share.count({
      where: { postId },
    });

    // Check if current user has shared (if logged in)
    let hasShared = false;
    if (loggedInUser) {
      const userShare = await prisma.share.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: loggedInUser.id,
          },
        },
      });
      hasShared = !!userShare;
    }

    debug.log(`GET /api/posts/${postId}/shares - Count: ${shareCount}, hasShared: ${hasShared}`);

    return Response.json({
      shareCount,
      hasShared,
    });

  } catch (error) {
    debug.error(`GET /api/posts/${postId}/shares - Error:`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
