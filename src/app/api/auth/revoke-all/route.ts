/**
 * API route for revoking all sessions/tokens (logout from all devices)
 * POST /api/auth/revoke-all - Logout from all devices
 * 
 * This endpoint:
 * - Revokes ALL refresh tokens for the user
 * - Deletes ALL sessions for the user
 * - Deactivates ALL device tokens (FCM push notifications)
 * - Sets user online status to OFFLINE
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

/**
 * POST /api/auth/revoke-all
 * Logout from all devices by revoking all tokens and sessions
 * Requires authentication (JWT or session)
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/revoke-all - Starting request");

    const user = await getAuthenticatedUser(req);

    if (!user) {
      debug.log("POST /api/auth/revoke-all - Unauthorized");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    debug.log(`POST /api/auth/revoke-all - Revoking all sessions for user: ${userId}`);

    // Track counts for response
    let sessionsDeleted = 0;
    let tokensRevoked = 0;
    let deviceTokensDeactivated = 0;

    // 1. Delete all sessions for the user
    try {
      const sessionResult = await prisma.session.deleteMany({
        where: { userId },
      });
      sessionsDeleted = sessionResult.count;
      debug.log(`POST /api/auth/revoke-all - Deleted ${sessionsDeleted} sessions`);
    } catch (error) {
      debug.error("Error deleting sessions:", error);
      // Continue even if this fails
    }

    // 2. Revoke all refresh tokens for the user
    try {
      const tokenResult = await prisma.refreshToken.updateMany({
        where: { 
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
      tokensRevoked = tokenResult.count;
      debug.log(`POST /api/auth/revoke-all - Revoked ${tokensRevoked} refresh tokens`);
    } catch (error) {
      debug.error("Error revoking refresh tokens:", error);
      // Continue even if this fails (table might not exist)
    }

    // 3. Deactivate all device tokens (FCM) for the user
    try {
      const deviceResult = await prisma.deviceToken.updateMany({
        where: { 
          userId,
          isActive: true,
        },
        data: { isActive: false },
      });
      deviceTokensDeactivated = deviceResult.count;
      debug.log(`POST /api/auth/revoke-all - Deactivated ${deviceTokensDeactivated} device tokens`);
    } catch (error) {
      debug.error("Error deactivating device tokens:", error);
      // Continue even if this fails
    }

    // 4. Set user online status to OFFLINE
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          onlineStatus: "OFFLINE",
          lastActiveAt: new Date(),
        },
      });
      debug.log("POST /api/auth/revoke-all - User status set to OFFLINE");
    } catch (error) {
      debug.error("Error updating user status:", error);
      // Continue even if this fails
    }

    debug.log(`POST /api/auth/revoke-all - Successfully logged out user ${userId} from all devices`);

    return Response.json({
      message: "Successfully logged out from all devices",
      details: {
        sessionsDeleted,
        tokensRevoked,
        deviceTokensDeactivated,
      },
    });
  } catch (error) {
    debug.error("POST /api/auth/revoke-all - Error:", error);
    return Response.json(
      { error: "An error occurred while logging out from all devices" },
      { status: 500 }
    );
  }
}
