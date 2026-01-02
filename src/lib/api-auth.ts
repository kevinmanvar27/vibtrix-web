/**
 * Shared authentication utilities for API routes
 * Handles both JWT (mobile) and session (web) authentication
 */
import { verifyJwtAuth } from "./jwt-middleware";
import { validateRequest } from "@/auth";

// Type for requests with headers (works with both Request and NextRequest)
type RequestWithHeaders = { headers: { get(name: string): string | null } };

// Common user fields needed for API operations
export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  role?: string;
  email?: string | null;
}

/**
 * Get authenticated user from JWT or session
 * Tries JWT first (for mobile apps), then falls back to session (for web)
 * @param req Request object with headers (Request or NextRequest)
 */
export async function getAuthenticatedUser(req: RequestWithHeaders): Promise<AuthUser | null> {
  // Try JWT authentication first (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return {
      id: jwtUser.id,
      username: jwtUser.username,
      displayName: jwtUser.displayName,
      avatarUrl: jwtUser.avatarUrl,
      isActive: jwtUser.isActive,
      role: jwtUser.role,
      email: jwtUser.email,
    };
  }
  
  // Fallback to session-based authentication (for web)
  const sessionResult = await validateRequest();
  if (sessionResult.user) {
    return {
      id: sessionResult.user.id,
      username: sessionResult.user.username,
      displayName: sessionResult.user.displayName,
      avatarUrl: sessionResult.user.avatarUrl,
      isActive: sessionResult.user.isActive,
      role: sessionResult.user.role,
      email: sessionResult.user.email,
    };
  }
  
  return null;
}
