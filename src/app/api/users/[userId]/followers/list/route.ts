/**
 * API route for getting a user's followers list with pagination
 * GET /api/users/{userId}/followers/list
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

const PAGE_SIZE = 20;

/**
 * GET /api/users/{userId}/followers/list
 * Get paginated list of users who follow the specified user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    debug.log(`GET /api/users/${userId}/followers/list - Starting request`);

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
      debug.log(`GET /api/users/${userId}/followers/list - User not found`);
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
        debug.log(`GET /api/users/${userId}/followers/list - Private profile, access denied`);
        return Response.json(
          { error: "This user's followers list is private" },
          { status: 403 }
        );
      }
    }

    // Fetch followers with pagination (offset-based since Follow uses compound key)
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      take: PAGE_SIZE + 1, // Fetch one extra to check if there are more
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            onlineStatus: true,
            // Check if logged in user follows this follower
            followers: loggedInUser ? {
              where: { followerId: loggedInUser.id },
              select: { followerId: true },
            } : {
              where: { followerId: '' },
              select: { followerId: true },
            },
            // Check if this follower follows the logged in user
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
    const hasMore = followers.length > PAGE_SIZE;
    const results = hasMore ? followers.slice(0, PAGE_SIZE) : followers;
    const nextPage = hasMore ? page + 1 : null;

    // Transform the results
    const transformedFollowers = results.map((follow) => ({
      id: follow.follower.id,
      username: follow.follower.username,
      displayName: follow.follower.displayName,
      avatarUrl: follow.follower.avatarUrl,
      bio: follow.follower.bio,
      onlineStatus: follow.follower.onlineStatus,
      followersCount: follow.follower._count.followers,
      followingCount: follow.follower._count.following,
      isFollowedByMe: follow.follower.followers.length > 0,
      isFollowingMe: follow.follower.following.length > 0,
      followedAt: follow.createdAt,
    }));

    debug.log(`GET /api/users/${userId}/followers/list - Found ${transformedFollowers.length} followers`);

    return Response.json({
      followers: transformedFollowers,
      nextPage,
      hasMore,
      totalCount: await prisma.follow.count({ where: { followingId: userId } }),
    });

  } catch (error) {
    debug.error(`Error fetching followers list for user ${userId}:`, error);
    return Response.json(
      { error: "Failed to fetch followers list" },
      { status: 500 }
    );
  }
}
