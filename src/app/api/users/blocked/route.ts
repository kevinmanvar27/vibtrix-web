import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * GET /api/users/blocked
 * Get the list of users blocked by the current user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Support both JWT and session authentication
    const loggedInUser = await getAuthenticatedUser(request);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users that the current user has blocked
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        blockerId: loggedInUser.id,
      },
      include: {
        blocked: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
    });

    // Extract just the user data from the results
    const users = blockedUsers.map((block) => block.blocked);

    return Response.json({ users });
  } catch (error) {
    debug.error("Error fetching blocked users:", error);
    return Response.json(
      { error: "Failed to fetch blocked users" },
      { status: 500 }
    );
  }
}
