import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { CommentsPage, getCommentDataInclude } from "@/lib/types";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import { z } from "zod";

/**
 * Helper function to get authenticated user from JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: Request) {
  // First try JWT authentication (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

// Validation schema for creating comments
const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});

/**
 * GET /api/posts/{postId}/comments
 * Get comments for a post with pagination
 * Supports both authenticated and guest users
 */
export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    // Try to get authenticated user (optional for viewing comments)
    const user = await getAuthenticatedUser(req);
    const isLoggedIn = !!user;

    // Check if comments feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { commentsEnabled: true },
    });

    if (!settings?.commentsEnabled) {
      return Response.json({ error: "Comments feature is currently disabled" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: getCommentDataInclude(isLoggedIn ? user.id : ''),
      orderBy: { createdAt: "asc" },
      take: -pageSize - 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const previousCursor = comments.length > pageSize ? comments[0].id : null;

    const data: CommentsPage = {
      comments: comments.length > pageSize ? comments.slice(1) : comments,
      previousCursor,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/posts/{postId}/comments
 * Create a new comment on a post
 * Requires authentication (JWT or session)
 */
export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
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
    const validationResult = createCommentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return Response.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = validationResult.data;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Create comment and notification in a transaction
    const [newComment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          postId,
          userId: user.id,
        },
        include: getCommentDataInclude(user.id),
      }),
      // Create notification if commenting on someone else's post
      ...(post.userId !== user.id
        ? [
            prisma.notification.create({
              data: {
                issuerId: user.id,
                recipientId: post.userId,
                postId,
                type: "COMMENT",
              },
            }),
          ]
        : []),
    ]);

    return Response.json(newComment, { status: 201 });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
