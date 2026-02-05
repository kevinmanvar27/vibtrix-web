import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * GET /api/posts/liked
 * Get all liked posts for the authenticated user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");
    const pageSize = limitParam ? parseInt(limitParam, 10) : 20;

    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const likes = await prisma.like.findMany({
      where: {
        userId: user.id,
      },
      include: {
        post: {
          include: getPostDataInclude(user.id),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Filter out any likes where post might be null (deleted posts)
    const validLikes = likes.filter((like) => like.post !== null);

    const nextCursor =
      validLikes.length > pageSize ? validLikes[pageSize].id : null;

    const data: PostsPage = {
      posts: validLikes.slice(0, pageSize).map((like) => like.post),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
