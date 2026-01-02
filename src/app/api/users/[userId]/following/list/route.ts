/**
 * API route for getting a user's following list with pagination
 * GET /api/users/{userId}/following/list
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

const PAGE_SIZE = 20;

/**
 * GET /api/users/{userId}/following/list
 * Get paginated list of users that the specified user follows
 */
export async function GET(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } }
) {
  try {
    debug.log(`GET /api/users/${userId}/following/list - Starting request`);

    const loggedInUser = await getAuthenticatedUser(request);
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const skip = (page - 1) * PAGE_SIZE;

    // Check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isProfilePublic: true,
      },
    });

    if (!targetUser) {
      debug.log(`GET /api/users/${userId}/following/list - User not found`);
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check privacy settings
    // If profile is private and viewer is not the owner, check if they follow
    if (!targetUser.isProfilePublic && loggedInUser?.id !== userId) {
      // Check if logged in user follows the target user
      const isFollowing = loggedInUser ? await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
        },
      }) : null;

      if (!isFollowing) {
        debug.log(`GET /api/users/${userId}/following/list - Private profile, access denied`);
        return Response.json(
          { error: "This user's following list is private" },
          { status: 403 }
        );
      }
    }

    // Fetch following with pagination (offset-based since Follow uses compound key)
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      take: PAGE_SIZE + 1, // Fetch one extra to check if there are more
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            onlineStatus: true,
            // Check if logged in user follows this user
            followers: loggedInUser ? {
              where: { followerId: loggedInUser.id },
              select: { followerId: true },
            } : {
              where: { followerId: '' },
              select: { followerId: true },
            },
            // Check if this user follows the logged in user
            following: loggedInUser ? {
              where: { followingId: loggedInUser.id },
              select: { followingId: true },
            } : {
              where: { followingId: '' },
              select: { followingId: true },
            },
            _count: {
              select: {
                followers: true,
                following: true,
              },
            },
          },
        },
      },
    });

    // Determine if there are more results
    const hasMore = following.length > PAGE_SIZE;
    const results = hasMore ? following.slice(0, PAGE_SIZE) : following;
    const nextPage = hasMore ? page + 1 : null;

    // Transform the results
    const transformedFollowing = results.map((follow) => ({
      id: follow.following.id,
      username: follow.following.username,
      displayName: follow.following.displayName,
      avatarUrl: follow.following.avatarUrl,
      bio: follow.following.bio,
      onlineStatus: follow.following.onlineStatus,
      followersCount: follow.following._count.followers,
      followingCount: follow.following._count.following,
      isFollowedByMe: follow.following.followers.length > 0,
      isFollowingMe: follow.following.following.length > 0,
      followedAt: follow.createdAt,
    }));

    debug.log(`GET /api/users/${userId}/following/list - Found ${transformedFollowing.length} following`);

    return Response.json({
      following: transformedFollowing,
      nextPage,
      hasMore,
      totalCount: await prisma.follow.count({ where: { followerId: userId } }),
    });

  } catch (error) {
    debug.error(`Error fetching following list for user ${userId}:`, error);
    return Response.json(
      { error: "Failed to fetch following list" },
      { status: 500 }
    );
  }
}
