import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import { NextRequest } from "next/server";

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

interface MutualFollower {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface MutualFollowersResponse {
  mutualFollowers: MutualFollower[];
  count: number;
  cursor?: string;
}

/**
 * GET /api/users/{userId}/mutual-followers
 * Get users who both follow and are followed by the target user AND the current user
 * (i.e., users that both the current user and target user follow mutually)
 * 
 * Query params:
 * - cursor: Pagination cursor (user id)
 * - limit: Number of results (default: 20, max: 50)
 */
export async function GET(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10), 1), 50);

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If viewing own profile, return empty (no mutual followers with yourself)
    if (loggedInUser.id === userId) {
      const response: MutualFollowersResponse = {
        mutualFollowers: [],
        count: 0,
      };
      return Response.json(response);
    }

    // Find mutual followers:
    // Users who are followed by BOTH the current user AND the target user
    // AND who follow BOTH the current user AND the target user
    // This gives us truly "mutual" connections between both users

    // Step 1: Get users that the current user follows
    const currentUserFollowing = await prisma.follow.findMany({
      where: { followerId: loggedInUser.id },
      select: { followingId: true },
    });
    const currentUserFollowingIds = new Set(currentUserFollowing.map(f => f.followingId));

    // Step 2: Get users that follow the current user
    const currentUserFollowers = await prisma.follow.findMany({
      where: { followingId: loggedInUser.id },
      select: { followerId: true },
    });
    const currentUserFollowerIds = new Set(currentUserFollowers.map(f => f.followerId));

    // Step 3: Get users that the target user follows
    const targetUserFollowing = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const targetUserFollowingIds = new Set(targetUserFollowing.map(f => f.followingId));

    // Step 4: Get users that follow the target user
    const targetUserFollowers = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    const targetUserFollowerIds = new Set(targetUserFollowers.map(f => f.followerId));

    // Step 5: Find mutual followers (users who both users follow AND who follow both users)
    // A mutual follower is someone who:
    // - Current user follows them AND they follow current user (mutual with current user)
    // - Target user follows them AND they follow target user (mutual with target user)
    const mutualFollowerIds: string[] = [];
    
    for (const id of currentUserFollowingIds) {
      // Skip the target user themselves
      if (id === userId) continue;
      
      // Check if this is a mutual connection for both users
      const isMutualWithCurrentUser = currentUserFollowerIds.has(id);
      const isMutualWithTargetUser = targetUserFollowingIds.has(id) && targetUserFollowerIds.has(id);
      
      if (isMutualWithCurrentUser && isMutualWithTargetUser) {
        mutualFollowerIds.push(id);
      }
    }

    // Apply cursor-based pagination
    let paginatedIds = mutualFollowerIds.sort(); // Sort for consistent ordering
    if (cursor) {
      const cursorIndex = paginatedIds.indexOf(cursor);
      if (cursorIndex !== -1) {
        paginatedIds = paginatedIds.slice(cursorIndex + 1);
      }
    }
    
    const idsToFetch = paginatedIds.slice(0, limit);
    const hasMore = paginatedIds.length > limit;

    // Fetch user details for the mutual followers
    const mutualFollowers = await prisma.user.findMany({
      where: {
        id: { in: idsToFetch },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const response: MutualFollowersResponse = {
      mutualFollowers,
      count: mutualFollowerIds.length,
      ...(hasMore && mutualFollowers.length > 0 && {
        cursor: mutualFollowers[mutualFollowers.length - 1].id,
      }),
    };

    return Response.json(response);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
