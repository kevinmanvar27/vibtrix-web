import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

/**
 * Helper function to get authenticated user from either JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

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
