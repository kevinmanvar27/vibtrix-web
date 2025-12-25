import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { verifyJwtAuth } from "@/lib/jwt-auth";

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

/**
 * GET /api/users/search
 * Search for users by username or display name
 * Supports both authenticated and guest users
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const isLoggedIn = !!user;

    // For guest users, we'll still show search results
    // but with limited functionality

    const query = request.nextUrl.searchParams.get("q");

    if (!query || query.length < 2) {
      return Response.json({ users: [] });
    }

    // For logged-in users, exclude blocked users and users who have blocked them
    let excludedUserIds: string[] = [];

    if (isLoggedIn) {
      // Get the list of users that the current user has blocked
      const blockedUsers = await prisma.userBlock.findMany({
        where: {
          blockerId: user.id,
        },
        select: {
          blockedId: true,
        },
      });

      // Get the list of users that have blocked the current user
      const blockedByUsers = await prisma.userBlock.findMany({
        where: {
          blockedId: user.id,
        },
        select: {
          blockerId: true,
        },
      });

      // Extract just the IDs from the results
      const blockedUserIds = blockedUsers.map((block) => block.blockedId);
      const blockedByUserIds = blockedByUsers.map((block) => block.blockerId);

      // Combine both lists to exclude from search results
      excludedUserIds = [...blockedUserIds, ...blockedByUserIds, user.id];
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
        // Only show users with role "USER"
        role: "USER",
        // Exclude the logged-in user and blocked users from search results
        id: { notIn: excludedUserIds },
      },
      select: getUserDataSelect(isLoggedIn ? user.id : ''),
      take: 15,
    });

    return Response.json({ users });
  } catch (error) {
    debug.error("Error searching users:", error);
    return Response.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
