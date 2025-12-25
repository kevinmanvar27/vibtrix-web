/**
 * API route for verifying password reset OTP
 * POST /api/auth/verify-reset-otp
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import debug from "@/lib/debug";

// Validation schema for OTP verification
const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

/**
 * POST /api/auth/verify-reset-otp
 * Verify the OTP and return a reset token if valid
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/verify-reset-otp - Starting request");

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(req, 'passwordReset');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      debug.log("POST /api/auth/verify-reset-otp - Rate limited");
      return rateLimitResult.response;
    }

    // Parse and validate request body
    const body = await req.json();
    
    const validation = verifyOTPSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/auth/verify-reset-otp - Validation failed:", validation.error.errors);
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

    const { email, otp } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find the password reset token by email and OTP
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        otp: otp,
      },
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
      debug.log("POST /api/auth/verify-reset-otp - Invalid OTP");
      return Response.json(
        { error: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      debug.log("POST /api/auth/verify-reset-otp - OTP expired");
      
      // Delete the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return Response.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    debug.log(`POST /api/auth/verify-reset-otp - OTP verified for user: ${resetToken.user.username}`);

    // Return the token for the reset password step
    return Response.json({
      success: true,
      message: "OTP verified successfully",
      token: resetToken.token,
    });

  } catch (error) {
    debug.error("POST /api/auth/verify-reset-otp - Error:", error);
    return Response.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
