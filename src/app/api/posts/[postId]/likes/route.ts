/**
 * API route for post likes
 * GET /api/posts/{postId}/likes - Get like count and status
 * POST /api/posts/{postId}/likes - Like a post
 * DELETE /api/posts/{postId}/likes - Unlike a post
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * GET /api/posts/{postId}/likes
 * Get like count and whether current user has liked
 */
export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    debug.log(`GET /api/posts/${postId}/likes - Starting request`);
    
    const loggedInUser = await getAuthenticatedUser(req);
    const isLoggedIn = !!loggedInUser;

    // Different query based on authentication status
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        // Only include likes where userId matches if user is logged in
        ...(isLoggedIn ? {
          likes: {
            where: {
              userId: loggedInUser.id,
            },
            select: {
              userId: true,
            },
          },
        } : {}),
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      debug.log(`GET /api/posts/${postId}/likes - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const data: LikeInfo = {
      likes: post._count.likes,
      // If user is not logged in, they haven't liked the post
      isLikedByUser: isLoggedIn ? !!(post.likes?.length) : false,
    };

    debug.log(`GET /api/posts/${postId}/likes - Returning ${data.likes} likes`);
    return Response.json(data);
  } catch (error) {
    debug.error(`GET /api/posts/${postId}/likes - Error:`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/posts/{postId}/likes
 * Like a post
 */
export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    debug.log(`POST /api/posts/${postId}/likes - Starting request`);
    
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      debug.log(`POST /api/posts/${postId}/likes - Unauthorized`);
      return Response.json({
        error: "Authentication required",
        redirectToLogin: true
      }, { status: 401 });
    }

    // Check if likes feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { likesEnabled: true },
    });

    if (!settings?.likesEnabled) {
      debug.log(`POST /api/posts/${postId}/likes - Likes disabled`);
      return Response.json({ error: "Likes feature is currently disabled" }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      debug.log(`POST /api/posts/${postId}/likes - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.like.upsert({
        where: {
          userId_postId: {
            userId: loggedInUser.id,
            postId,
          },
        },
        create: {
          userId: loggedInUser.id,
          postId,
        },
        update: {},
      }),
      ...(loggedInUser.id !== post.userId
        ? [
          prisma.notification.create({
            data: {
              issuerId: loggedInUser.id,
              recipientId: post.userId,
              postId,
              type: "LIKE",
            },
          }),
        ]
        : []),
    ]);

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    debug.log(`POST /api/posts/${postId}/likes - Like added, count: ${likeCount}`);
    return Response.json({ 
      success: true,
      likes: likeCount,
      isLikedByUser: true,
    });
  } catch (error) {
    debug.error(`POST /api/posts/${postId}/likes - Error:`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/posts/{postId}/likes
 * Unlike a post
 */
export async function DELETE(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    debug.log(`DELETE /api/posts/${postId}/likes - Starting request`);
    
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      debug.log(`DELETE /api/posts/${postId}/likes - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      debug.log(`DELETE /api/posts/${postId}/likes - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.like.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { postId },
    });

    debug.log(`DELETE /api/posts/${postId}/likes - Like removed, count: ${likeCount}`);
    return Response.json({ 
      success: true,
      likes: likeCount,
      isLikedByUser: false,
    });
  } catch (error) {
    debug.error(`DELETE /api/posts/${postId}/likes - Error:`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
