/**
 * JWT authentication middleware for API routes
 */
import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import prisma from "./prisma";
import debug from "./debug";

/**
 * Verify JWT token from Authorization header
 * @param req Next.js request object
 * @returns User object if authenticated, null otherwise
 */
export async function verifyJwtAuth(req: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      debug.log("JWT Auth - No valid Authorization header");
      return null;
    }
    
    // Extract the token
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      debug.log("JWT Auth - No token in Authorization header");
      return null;
    }
    
    try {
      // Verify the token
      const payload = await verifyToken(token, "access");
      
      // Get user from database to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });
      
      if (!user || !user.isActive) {
        debug.log(`JWT Auth - User not found or inactive: ${payload.sub}`);
        return null;
      }
      
      // Update user's last active time (but don't await to avoid slowing down requests)
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveAt: new Date(),
        },
      }).catch(error => {
        debug.error("Error updating user's last active time:", error);
      });
      
      return user;
    } catch (error) {
      debug.error("JWT Auth - Error verifying token:", error);
      return null;
    }
  } catch (error) {
    debug.error("JWT Auth - Unexpected error:", error);
    return null;
  }
}

/**
 * Middleware to handle both cookie-based and JWT token-based authentication
 * @param req Next.js request object
 * @returns User object if authenticated through either method, null otherwise
 */
export async function validateAuthRequest(req: NextRequest) {
  // First try JWT authentication for API clients
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return { user: jwtUser };
  }
  
  // If JWT auth fails, fall back to cookie-based session (for browser clients)
  // This is handled by the existing validateRequest function in auth.ts
  // We don't call it here to avoid circular dependencies
  
  return { user: null };
}
