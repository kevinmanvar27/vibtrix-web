/**
 * API route for managing individual comments
 * DELETE /api/posts/{postId}/comments/{commentId}
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJwtAuth } from "@/lib/jwt-middleware";
import { validateRequest } from "@/auth";
import debug from "@/lib/debug";

/**
 * Helper function to get authenticated user from JWT or session
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  let user = await verifyJwtAuth(req);
  
  // Fallback to session-based authentication (for web)
  if (!user) {
    const sessionResult = await validateRequest();
    user = sessionResult.user;
  }
  
  return user;
}

/**
 * DELETE /api/posts/{postId}/comments/{commentId}
 * Delete a comment (user can delete their own comments or comments on their posts)
 */
export async function DELETE(
  request: NextRequest,
  { params: { postId, commentId } }: { params: { postId: string; commentId: string } }
) {
  try {
    debug.log(`DELETE /api/posts/${postId}/comments/${commentId} - Starting request`);
    
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log(`DELETE /api/posts/${postId}/comments/${commentId} - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if comments feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { commentsEnabled: true },
    });

    if (!settings?.commentsEnabled) {
      return Response.json(
        { error: "Comments feature is currently disabled" },
        { status: 403 }
      );
    }

    // Find the comment with post info
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        postId: true,
        post: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      debug.log(`DELETE /api/posts/${postId}/comments/${commentId} - Comment not found`);
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify the comment belongs to the specified post
    if (comment.postId !== postId) {
      debug.log(`DELETE /api/posts/${postId}/comments/${commentId} - Comment does not belong to this post`);
      return Response.json(
        { error: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    // Check if user can delete the comment
    // User can delete if: they own the comment OR they own the post
    const isCommentOwner = comment.userId === user.id;
    const isPostOwner = comment.post.userId === user.id;

    if (!isCommentOwner && !isPostOwner) {
      debug.log(`DELETE /api/posts/${postId}/comments/${commentId} - User cannot delete this comment`);
      return Response.json(
        { error: "You can only delete your own comments or comments on your posts" },
        { status: 403 }
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    debug.log(`DELETE /api/posts/${postId}/comments/${commentId} - Comment deleted successfully`);
    return Response.json({ message: "Comment deleted successfully" });

  } catch (error) {
    debug.error(`Error deleting comment ${commentId}:`, error);
    return Response.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/{postId}/comments/{commentId}
 * Get a specific comment
 */
export async function GET(
  request: NextRequest,
  { params: { postId, commentId } }: { params: { postId: string; commentId: string } }
) {
  try {
    debug.log(`GET /api/posts/${postId}/comments/${commentId} - Starting request`);

    const user = await getAuthenticatedUser(request);

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            onlineStatus: true,
          },
        },
      },
    });

    if (!comment) {
      debug.log(`GET /api/posts/${postId}/comments/${commentId} - Comment not found`);
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify the comment belongs to the specified post
    if (comment.postId !== postId) {
      debug.log(`GET /api/posts/${postId}/comments/${commentId} - Comment does not belong to this post`);
      return Response.json(
        { error: "Comment does not belong to this post" },
        { status: 400 }
      );
    }

    debug.log(`GET /api/posts/${postId}/comments/${commentId} - Comment found`);
    return Response.json(comment);

  } catch (error) {
    debug.error(`Error fetching comment ${commentId}:`, error);
    return Response.json(
      { error: "Failed to fetch comment" },
      { status: 500 }
    );
  }
}
