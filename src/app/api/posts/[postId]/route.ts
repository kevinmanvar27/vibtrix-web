import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  try {
    debug.log(`GET /api/posts/${postId} - Starting request`);
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log(`GET /api/posts/${postId} - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log(`GET /api/posts/${postId} - User authenticated:`, user.id);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
        attachments: true,
        likes: {
          where: { userId: user.id },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId: user.id },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      debug.log(`GET /api/posts/${postId} - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if post is by a blocked user
    const isBlockedByUser = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: post.userId },
          { blockerId: post.userId, blockedId: user.id },
        ],
      },
    });

    if (isBlockedByUser) {
      debug.log(`GET /api/posts/${postId} - Post by blocked user`);
      return Response.json(
        { error: "Post not available" },
        { status: 403 }
      );
    }

    debug.log(`GET /api/posts/${postId} - Post found`);
    return Response.json(post);
  } catch (error) {
    debug.error(`Error fetching post ${postId}:`, error);
    return Response.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/{postId}
 * Delete a post owned by the current user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  try {
    debug.log(`DELETE /api/posts/${postId} - Starting request`);
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log(`DELETE /api/posts/${postId} - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if post exists and belongs to the user
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        competitionEntries: {
          select: {
            round: {
              select: {
                endDate: true,
                competition: {
                  select: {
                    id: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!post) {
      debug.log(`DELETE /api/posts/${postId} - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user owns the post
    if (post.userId !== user.id) {
      debug.log(`DELETE /api/posts/${postId} - User does not own this post`);
      return Response.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Check if post is part of an active competition (competition is active and round hasn't ended)
    const activeCompetitionEntry = post.competitionEntries.find(entry => {
      const round = entry.round;
      if (!round?.competition) return false;
      const now = new Date();
      return round.competition.isActive && round.endDate > now;
    });
    
    if (activeCompetitionEntry) {
      debug.log(`DELETE /api/posts/${postId} - Post is part of active competition`);
      return Response.json(
        { error: "Cannot delete a post that is part of an active competition" },
        { status: 403 }
      );
    }

    // Delete the post (cascade will handle related data like likes, comments, bookmarks)
    await prisma.post.delete({
      where: { id: postId },
    });

    debug.log(`DELETE /api/posts/${postId} - Post deleted successfully`);
    return Response.json({ message: "Post deleted successfully" });

  } catch (error) {
    debug.error(`Error deleting post ${postId}:`, error);
    return Response.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
