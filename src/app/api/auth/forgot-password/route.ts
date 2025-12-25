/**
 * API route for password reset request with OTP
 * POST /api/auth/forgot-password
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateOTP, sendPasswordResetOTP } from "@/lib/email";
import debug from "@/lib/debug";

// Validation schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// OTP expiry time: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * POST /api/auth/forgot-password
 * Request a password reset OTP
 * 
 * Note: For security, always returns success even if email not found
 * to prevent email enumeration attacks
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/forgot-password - Starting request");

    // Apply rate limiting for password reset
    const rateLimitResult = applyRateLimit(req, 'passwordReset');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      debug.log("POST /api/auth/forgot-password - Rate limited");
      return rateLimitResult.response;
    }

    // Parse and validate request body
    const body = await req.json();
    
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/auth/forgot-password - Validation failed:", validation.error.errors);
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

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // For security, always return success message
    // This prevents email enumeration attacks
    const successResponse = {
      message: "If an account with that email exists, a password reset OTP has been sent.",
      success: true,
    };

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    });

    // If user not found or is OAuth-only user (no password), return success silently
    if (!user) {
      debug.log("POST /api/auth/forgot-password - User not found (silent)");
      return Response.json(successResponse);
    }

    if (!user.passwordHash) {
      debug.log("POST /api/auth/forgot-password - OAuth user, no password to reset (silent)");
      return Response.json(successResponse);
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure random token and OTP
    const token = crypto.randomUUID();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Store the token and OTP in the database
    await prisma.passwordResetToken.create({
      data: {
        token,
        otp,
        email: normalizedEmail,
        userId: user.id,
        expiresAt,
      },
    });

    // Send OTP email
    const emailSent = await sendPasswordResetOTP(
      user.email!,
      user.username,
      otp
    );

    if (emailSent) {
      debug.log("POST /api/auth/forgot-password - OTP sent successfully");
    } else {
      debug.error("POST /api/auth/forgot-password - Failed to send OTP email");
      // Don't fail the request - token is still valid
    }

    debug.log("POST /api/auth/forgot-password - OTP generated successfully");
    debug.log(`=== DEV ONLY: OTP for ${user.email} is ${otp} ===`);
    
    return Response.json(successResponse);

  } catch (error) {
    debug.error("POST /api/auth/forgot-password - Error:", error);
    return Response.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
