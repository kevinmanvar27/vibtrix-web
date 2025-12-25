/**
 * API route for sending email verification OTP
 * POST /api/auth/send-verification-otp
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateOTP, sendEmailVerificationOTP } from "@/lib/email";
import { validateAuthRequest } from "@/lib/jwt-middleware";
import debug from "@/lib/debug";

// Validation schema - passthrough allows extra fields from Flutter app
const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  // Allow extra fields from Flutter (purpose, phone) but ignore them
}).passthrough();

// OTP expiry time: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * POST /api/auth/send-verification-otp
 * Send email verification OTP to the authenticated user
 * 
 * Can be called:
 * 1. By authenticated user to verify their email
 * 2. With email in body (for re-verification flows)
 */
export async function POST(req: NextRequest) {
  try {
    console.log("========================================");
    console.log("POST /api/auth/send-verification-otp - Starting request");
    debug.log("POST /api/auth/send-verification-otp - Starting request");

    // Apply rate limiting
    const rateLimitResult = applyRateLimit(req, 'emailVerification');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      debug.log("POST /api/auth/send-verification-otp - Rate limited");
      return rateLimitResult.response;
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    console.log("Request body received:", JSON.stringify(body, null, 2));
    
    const validation = sendOtpSchema.safeParse(body);
    
    if (!validation.success) {
      console.log("Validation failed:", JSON.stringify(validation.error.errors, null, 2));
      return Response.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }
    
    console.log("Validation passed, email:", validation.data.email);

    // Try to get authenticated user first
    const { user: authUser } = await validateAuthRequest(req);
    console.log("Auth user found:", authUser ? `${authUser.id} (${authUser.email})` : "null");
    
    let userId: string;
    let email: string;
    let username: string;

    if (authUser) {
      // Authenticated user - use their info
      if (!authUser.email) {
        return Response.json(
          { error: "No email associated with this account" },
          { status: 400 }
        );
      }
      
      if (authUser.emailVerified) {
        return Response.json(
          { error: "Email is already verified" },
          { status: 400 }
        );
      }

      userId = authUser.id;
      email = authUser.email;
      username = authUser.username;
    } else if (validation.data.email) {
      // Not authenticated but email provided - find user by email
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: validation.data.email.toLowerCase().trim(),
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          emailVerified: true,
        },
      });

      if (!user || !user.email) {
        // Don't reveal if user exists
        return Response.json({
          success: true,
          message: "If an account with that email exists, a verification code has been sent.",
        });
      }

      if (user.emailVerified) {
        return Response.json({
          success: true,
          message: "If an account with that email exists, a verification code has been sent.",
        });
      }

      userId = user.id;
      email = user.email;
      username = user.username;
    } else {
      return Response.json(
        { error: "Authentication required or email must be provided" },
        { status: 401 }
      );
    }

    // Delete any existing verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Store the OTP in the database
    await prisma.emailVerificationToken.create({
      data: {
        otp,
        email: email.toLowerCase().trim(),
        userId,
        expiresAt,
      },
    });

    // Send OTP email
    console.log(`Attempting to send OTP email to: ${email}, username: ${username}, otp: ${otp}`);
    const emailSent = await sendEmailVerificationOTP(email, username, otp);
    console.log(`Email send result: ${emailSent}`);

    if (!emailSent) {
      console.error("POST /api/auth/send-verification-otp - Failed to send email");
      debug.error("POST /api/auth/send-verification-otp - Failed to send email");
      return Response.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    console.log("========================================");
    console.log(`=== DEV ONLY: Email verification OTP for ${email} is ${otp} ===`);
    console.log("========================================");
    debug.log("POST /api/auth/send-verification-otp - OTP sent successfully");
    debug.log(`=== DEV ONLY: Email verification OTP for ${email} is ${otp} ===`);

    return Response.json({
      success: true,
      message: "Verification code sent to your email.",
    });

  } catch (error) {
    console.error("POST /api/auth/send-verification-otp - Error:", error);
    debug.error("POST /api/auth/send-verification-otp - Error:", error);
    return Response.json(
      { error: "Failed to send verification code", details: String(error) },
      { status: 500 }
    );
  }
}
