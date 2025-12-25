/**
 * API route for refreshing JWT tokens
 */
import { NextRequest } from "next/server";
import { generateToken, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

/**
 * POST /api/auth/refresh
 * Refresh an expired access token using a valid refresh token
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/refresh - Starting request");
    
    // Get refresh token from request body
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      debug.log("POST /api/auth/refresh - Missing refresh token");
      return Response.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }
    
    try {
      // Verify the refresh token
      const payload = await verifyToken(refreshToken, "refresh");
      
      // Get user from database to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
      
      if (!user || !user.isActive) {
        debug.log(`POST /api/auth/refresh - User not found or inactive: ${payload.sub}`);
        return Response.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }
      
      // Check if the user has the USER role
      if (user.role !== "USER") {
        debug.log(`POST /api/auth/refresh - User ${user.username} has role ${user.role}, access denied`);
        return Response.json(
          { error: "Access denied. Your account does not have permission to log in." },
          { status: 403 }
        );
      }
      
      // Generate a new access token
      const newAccessToken = await generateToken(user.id, "access", user.role);
      
      // Update user's last active time
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveAt: new Date(),
          onlineStatus: "ONLINE"
        }
      });
      
      // Return the new access token
      return Response.json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      debug.error("Error verifying refresh token:", error);
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    debug.error("Error in token refresh:", error);
    return Response.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
