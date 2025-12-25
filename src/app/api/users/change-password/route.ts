/**
 * API route for changing user password
 * POST /api/users/change-password
 */
import { NextRequest } from "next/server";
import { verify, hash } from "@node-rs/argon2";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyJwtAuth } from "@/lib/jwt-middleware";
import { validateRequest } from "@/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import debug from "@/lib/debug";

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

/**
 * Helper function to get authenticated user from JWT or session
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  let user = await verifyJwtAuth(req);
  
  // Fallback to session-based authentication (for web)
  if (!user) {
    const sessionResult = await validateRequest();
    user = sessionResult.user;
  }
  
  return user;
}

/**
 * POST /api/users/change-password
 * Change the current user's password
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/users/change-password - Starting request");

    // Apply rate limiting for password operations
    const rateLimitResult = applyRateLimit(req, 'passwordReset');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const user = await getAuthenticatedUser(req);

    if (!user) {
      debug.log("POST /api/users/change-password - Unauthorized");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/users/change-password - Validation failed:", validation.error.errors);
      return Response.json(
        {
          error: "Validation failed",
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!userWithPassword?.passwordHash) {
      // User signed up with OAuth, no password to change
      return Response.json(
        { error: "Cannot change password. Your account uses social login." },
        { status: 400 }
      );
    }

    // Verify current password
    const validPassword = await verify(userWithPassword.passwordHash, currentPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      debug.log(`POST /api/users/change-password - Invalid current password for user: ${user.id}`);
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    debug.log(`POST /api/users/change-password - Password changed for user: ${user.id}`);
    return Response.json({ message: "Password changed successfully" });

  } catch (error) {
    debug.error("POST /api/users/change-password - Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
