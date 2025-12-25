import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
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
 * GET /api/users/username/{username}
 * Get user profile by username
 * Supports both authenticated and guest users
 */
export async function GET(
  req: Request,
  { params: { username } }: { params: { username: string } },
) {
  try {
    const loggedInUser = await getAuthenticatedUser(req);
    const isLoggedIn = !!loggedInUser;

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
        // Only show users with role "USER"
        role: "USER",
      },
      select: getUserDataSelect(isLoggedIn ? loggedInUser.id : ''),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
