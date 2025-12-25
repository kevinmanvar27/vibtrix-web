/**
 * API route for revoking JWT refresh tokens (logout)
 */
import { NextRequest } from "next/server";
import { revokeToken, verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

/**
 * POST /api/auth/revoke
 * Revoke a refresh token (logout)
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/revoke - Starting request");
    
    // Get refresh token from request body
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      debug.log("POST /api/auth/revoke - Missing refresh token");
      return Response.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }
    
    try {
      // Verify the refresh token
      const payload = await verifyToken(refreshToken, "refresh");
      
      // Revoke the token
      await revokeToken(payload.jti);
      
      // Update user's online status
      await prisma.user.update({
        where: { id: payload.sub },
        data: {
          onlineStatus: "OFFLINE"
        }
      });
      
      return Response.json({
        message: "Token revoked successfully",
      });
    } catch (error) {
      debug.error("Error revoking token:", error);
      // Return success even if token is invalid to prevent information leakage
      return Response.json({
        message: "Token revoked successfully",
      });
    }
  } catch (error) {
    debug.error("Error in token revocation:", error);
    return Response.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
