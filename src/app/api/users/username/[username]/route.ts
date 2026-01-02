import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

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

    // Note: MySQL with default collation is case-insensitive by default
    const user = await prisma.user.findFirst({
      where: {
        username: username,
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
