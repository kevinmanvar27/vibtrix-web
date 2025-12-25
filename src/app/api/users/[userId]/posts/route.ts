import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
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
 * GET /api/users/{userId}/posts
 * Get posts for a specific user
 * Supports both authenticated and guest users
 * Respects privacy settings
 */
export async function GET(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const user = await getAuthenticatedUser(req);
    const isLoggedIn = !!user;

    // Check if the profile is private and not the logged-in user
    const profileUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isProfilePublic: true,
        id: true,
        role: true, // Include role to check if it's a regular user
        followers: isLoggedIn ? {
          where: {
            followerId: user.id
          },
          select: {
            followerId: true
          }
        } : {
          where: {
            followerId: '' // This will return an empty array for guest users
          },
          select: {
            followerId: true
          }
        }
      }
    });

    if (!profileUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const isFollower = isLoggedIn ? profileUser.followers.length > 0 : false;

    // If the user is not a regular user (role is not "USER"), don't show their posts
    // unless the logged-in user is the same user
    if (profileUser.role !== "USER" && (!isLoggedIn || profileUser.id !== user.id)) {
      return Response.json({
        error: "User not found",
        posts: [],
        nextCursor: null
      }, { status: 404 });
    }

    // If the profile is private, not the logged-in user, and not a follower, return an empty response
    // For guest users, only show public profiles
    if (!profileUser.isProfilePublic && (!isLoggedIn || (profileUser.id !== user.id && !isFollower))) {
      return Response.json({
        error: "This user's profile is private",
        posts: [],
        nextCursor: null
      }, { status: 403 });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      include: getPostDataInclude(isLoggedIn ? user.id : ''),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
