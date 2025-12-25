/**
 * API route for password reset completion
 * POST /api/auth/reset-password
 */
import { NextRequest } from "next/server";
import { hash } from "@node-rs/argon2";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import debug from "@/lib/debug";

// Validation schema for reset password request
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * POST /api/auth/reset-password
 * Reset password using a valid token (after OTP verification)
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/reset-password - Starting request");

    // Apply rate limiting for password reset
    const rateLimitResult = applyRateLimit(req, 'passwordReset');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      debug.log("POST /api/auth/reset-password - Rate limited");
      return rateLimitResult.response;
    }

    // Parse and validate request body
    const body = await req.json();
    
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/auth/reset-password - Validation failed:", validation.error.errors);
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

    const { token, newPassword } = validation.data;

    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Check if token exists
    if (!resetToken) {
      debug.log("POST /api/auth/reset-password - Invalid token");
      return Response.json(
        { error: "Invalid or expired password reset session" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      debug.log("POST /api/auth/reset-password - Token expired");
      
      // Delete the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return Response.json(
        { error: "Password reset session has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Hash the new password with Argon2
    const passwordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update user's password and invalidate all sessions in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Delete all existing sessions for this user (force re-login)
      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      });

      // Delete the used password reset token
      await tx.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      // Delete any other password reset tokens for this user
      await tx.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    });

    debug.log(`POST /api/auth/reset-password - Password reset successful for user: ${resetToken.user.username}`);

    return Response.json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password.",
    });

  } catch (error) {
    debug.error("POST /api/auth/reset-password - Error:", error);
    return Response.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password
 * Validate a password reset token (for checking if link is valid before showing form)
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return Response.json(
        { error: "Token is required", valid: false },
        { status: 400 }
      );
    }

    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!resetToken) {
      return Response.json(
        { error: "Invalid password reset link", valid: false },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      // Delete the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return Response.json(
        { error: "Password reset link has expired", valid: false },
        { status: 400 }
      );
    }

    // Mask the email for privacy
    const email = resetToken.user.email;
    const maskedEmail = email 
      ? email.replace(/^(.{2})(.*)(@.*)$/, (_, start, middle, end) => 
          start + '*'.repeat(Math.min(middle.length, 5)) + end
        )
      : null;

    return Response.json({
      valid: true,
      email: maskedEmail,
      expiresAt: resetToken.expiresAt.toISOString(),
    });

  } catch (error) {
    debug.error("GET /api/auth/reset-password - Error:", error);
    return Response.json(
      { error: "Failed to validate token", valid: false },
      { status: 500 }
    );
  }
}
