/**
 * API route for fetching user profile by ID
 * GET /api/users/{userId}
 */
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { NextRequest } from "next/server";

/**
 * GET /api/users/{userId}
 * Get user profile by user ID
 * Supports both authenticated and guest users
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    
    debug.log(`GET /api/users/${userId} - Fetching user profile`);
    
    const loggedInUser = await getAuthenticatedUser(req);
    const isLoggedIn = !!loggedInUser;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        // Only show users with role "USER"
        role: "USER",
      },
      select: getUserDataSelect(isLoggedIn ? loggedInUser.id : ''),
    });

    if (!user) {
      debug.log(`GET /api/users/${userId} - User not found`);
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    debug.log(`GET /api/users/${userId} - Found user: ${user.username}`);
    return Response.json(user);
  } catch (error) {
    debug.error(`GET /api/users/[userId] - Error:`, error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
