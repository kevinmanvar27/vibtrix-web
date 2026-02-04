import prisma from "@/lib/prisma";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * GET /api/users/{userId}/follow-status
 * Check if the current user is following another user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the current user is following the specified user
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: loggedInUser.id,
          followingId: userId,
        },
      },
    });

    // Check if the specified user is following the current user
    const followedBy = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: loggedInUser.id,
        },
      },
    });

    // Check if there's a pending follow request
    const pendingRequest = await prisma.followRequest.findUnique({
      where: {
        requesterId_recipientId: {
          requesterId: loggedInUser.id,
          recipientId: userId,
        },
      },
    });

    return Response.json({
      isFollowing: !!follow,
      isFollowedBy: !!followedBy,
      isPending: !!pendingRequest,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
