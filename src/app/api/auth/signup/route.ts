/**
 * API route for user registration (mobile app)
 * POST /api/auth/signup
 */
import { hash } from "@node-rs/argon2";
import { NextRequest } from "next/server";
import { generateIdFromEntropySize } from "lucia";
import prisma from "@/lib/prisma";
import { generateAuthTokens } from "@/lib/jwt";
import { applyRateLimit } from "@/lib/rate-limit";
import { trackLoginAttempt } from "@/lib/auth-security";
import { signUpSchema } from "@/lib/validation";
import debug from "@/lib/debug";

/**
 * POST /api/auth/signup
 * Register a new user and return authentication tokens
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/signup - Starting registration request");

    // Apply rate limiting for authentication
    const rateLimitResult = applyRateLimit(req, 'auth');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // Parse and validate request body
    const body = await req.json();
    
    // Validate input using existing schema
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/auth/signup - Validation failed:", validation.error.errors);
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

    const { username, email, password } = validation.data;

    // Check if username already exists
    // Note: MySQL with default collation is case-insensitive by default
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    if (existingUsername) {
      debug.log(`POST /api/auth/signup - Username already taken: ${username}`);
      return Response.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (existingEmail) {
      debug.log(`POST /api/auth/signup - Email already taken: ${email}`);
      return Response.json(
        { error: "Email already taken" },
        { status: 409 }
      );
    }

    // Hash password with Argon2
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Generate unique user ID
    const userId = generateIdFromEntropySize(10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email: email.toLowerCase(),
        passwordHash,
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE",
        role: "USER",
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        email: true,
      },
    });

    // Generate JWT tokens
    const tokens = await generateAuthTokens(user.id, user.role);

    // Track successful registration
    await trackLoginAttempt(req, username, true, user.id);

    debug.log(`POST /api/auth/signup - User registered successfully: ${user.id}`);

    // Return tokens and user info
    return Response.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        email: user.email,
      },
    }, { status: 201 });

  } catch (error) {
    // Log detailed error for debugging
    console.error("POST /api/auth/signup - Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      error: error
    });
    debug.error("POST /api/auth/signup - Error:", error);
    
    // Return more specific error in development
    const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : "An error occurred while processing your request";
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
