import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

// GET endpoint to check if the current user is following another user
export async function GET(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

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

    return Response.json({
      isFollowing: !!follow,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
