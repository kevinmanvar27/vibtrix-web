/**
 * API route for verifying email with OTP
 * POST /api/auth/verify-email-otp
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateAuthRequest } from "@/lib/jwt-middleware";
import debug from "@/lib/debug";

// Validation schema - passthrough allows extra fields from Flutter app
const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  // Allow extra fields from Flutter (phone) but ignore them
}).passthrough();

/**
 * POST /api/auth/verify-email-otp
 * Verify email using OTP
 * 
 * Can be called:
 * 1. By authenticated user (email from session)
 * 2. With email in body (for flows where user isn't logged in yet)
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/verify-email-otp - Starting request");

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(req, 'otpVerification');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      debug.log("POST /api/auth/verify-email-otp - Rate limited");
      return rateLimitResult.response;
    }

    // Parse and validate request body
    const body = await req.json();
    debug.log("Request body received:", JSON.stringify(body, null, 2));
    
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      debug.log("Validation failed:", JSON.stringify(validation.error.errors, null, 2));
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
    
    debug.log("Validation passed, email:", validation.data.email, "otp:", validation.data.otp);

    const { otp } = validation.data;
    let email: string | undefined = validation.data.email;

    // Try to get authenticated user
    const { user: authUser } = await validateAuthRequest(req);
    debug.log("Auth user found:", authUser ? `${authUser.id} (${authUser.email})` : "null");

    if (authUser) {
      // Use authenticated user's email
      if (!authUser.email) {
        return Response.json(
          { error: "No email associated with this account" },
          { status: 400 }
        );
      }
      email = authUser.email;
    } else if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // At this point, email is guaranteed to be defined
    const normalizedEmail = email!.toLowerCase().trim();

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        email: normalizedEmail,
        otp,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
          },
        },
      },
    });

    if (!verificationToken) {
      debug.log("POST /api/auth/verify-email-otp - Invalid OTP for email:", normalizedEmail);
      return Response.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }
    
    debug.log("Found verification token:", verificationToken.id, "expires:", verificationToken.expiresAt);

    // Check if OTP is expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      debug.log("POST /api/auth/verify-email-otp - OTP expired");
      return Response.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update user's emailVerified status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete the used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Also delete any other verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: verificationToken.userId },
    });

    debug.log("POST /api/auth/verify-email-otp - Email verified successfully for user:", verificationToken.userId);

    return Response.json({
      success: true,
      message: "Email verified successfully!",
    });

  } catch (error) {
    debug.error("POST /api/auth/verify-email-otp - Error:", error);
    return Response.json(
      { error: "Failed to verify email", details: String(error) },
      { status: 500 }
    );
  }
}
