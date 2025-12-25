import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import { z } from "zod";

/**
 * Helper function to get authenticated user from JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // First try JWT authentication (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

// Validation schema for creating replies
const createReplySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(1000, "Reply is too long"),
});

interface CommentReply {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface RepliesResponse {
  replies: CommentReply[];
  nextCursor: string | null;
  totalCount: number;
}

/**
 * GET /api/posts/{postId}/comments/{commentId}/replies
 * Get replies to a specific comment with pagination
 * Supports both authenticated and guest users
 * 
 * Query params:
 * - cursor: Pagination cursor (reply id)
 * - limit: Number of results (default: 10, max: 50)
 */
export async function GET(
  req: NextRequest,
  { params: { postId, commentId } }: { params: { postId: string; commentId: string } },
) {
  try {
    // Auth is optional for viewing replies
    await getAuthenticatedUser(req);

    // Parse query parameters
    const cursor = req.nextUrl.searchParams.get("cursor");
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "10", 10), 1), 50);

    // Check if comments feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { commentsEnabled: true },
    });

    if (!settings?.commentsEnabled) {
      return Response.json({ error: "Comments feature is currently disabled" }, { status: 403 });
    }

    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify the parent comment exists and belongs to this post
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });

    if (!parentComment) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    if (parentComment.postId !== postId) {
      return Response.json({ error: "Comment does not belong to this post" }, { status: 400 });
    }

    // Get total count of replies
    const totalCount = await prisma.comment.count({
      where: { parentId: commentId },
    });

    // Fetch replies with cursor-based pagination
    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item
      }),
    });

    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, limit) : replies;

    const response: RepliesResponse = {
      replies: items.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        user: reply.user,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
      totalCount,
    };

    return Response.json(response);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/posts/{postId}/comments/{commentId}/replies
 * Create a reply to a specific comment
 * Requires authentication (JWT or session)
 * 
 * Request body:
 * - content: Reply content (required, 1-1000 characters)
 */
export async function POST(
  req: NextRequest,
  { params: { postId, commentId } }: { params: { postId: string; commentId: string } },
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if comments feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { commentsEnabled: true },
    });

    if (!settings?.commentsEnabled) {
      return Response.json({ error: "Comments feature is currently disabled" }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const validationResult = createReplySchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify the parent comment exists and belongs to this post
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, userId: true },
    });

    if (!parentComment) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    if (parentComment.postId !== postId) {
      return Response.json({ error: "Comment does not belong to this post" }, { status: 400 });
    }

    // Create reply and notification in a transaction
    const [newReply] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          postId,
          userId: user.id,
          parentId: commentId, // Link to parent comment
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      // Create notification for the parent comment author (if different from replier)
      ...(parentComment.userId !== user.id
        ? [
            prisma.notification.create({
              data: {
                issuerId: user.id,
                recipientId: parentComment.userId,
                postId,
                type: "COMMENT", // Using COMMENT type for reply notifications
              },
            }),
          ]
        : []),
    ]);

    const response: CommentReply = {
      id: newReply.id,
      content: newReply.content,
      createdAt: newReply.createdAt,
      user: newReply.user,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
