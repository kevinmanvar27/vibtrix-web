/**
 * Secure API route for generating JWT tokens for mobile authentication
 */
import { verify } from "@node-rs/argon2";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateAuthTokens } from "@/lib/jwt";
import { getClientIP } from "@/lib/security";
import { applyRateLimit } from "@/lib/rate-limit";
import { sanitizeUserInput, validateSQLInput } from "@/lib/sql-security";
import { trackLoginAttempt } from "@/lib/auth-security";
import { secureLoginSchema } from "@/lib/validation-security";
import debug from "@/lib/debug";

/**
 * POST /api/auth/token
 * Generate authentication tokens for mobile apps with enhanced security
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/token - Starting secure request");

    // Apply rate limiting for authentication
    const rateLimitResult = applyRateLimit(req, 'auth');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // Get and validate credentials from request body
    const body = await req.json();
    const { username, password } = sanitizeUserInput(body);

    // Validate input using secure schema
    const validation = secureLoginSchema.safeParse({ username, password });
    if (!validation.success) {
      debug.log("POST /api/auth/token - Invalid input format");
      await trackLoginAttempt(req, username || 'unknown', false);
      return Response.json(
        { error: "Invalid input format" },
        { status: 400 }
      );
    }

    // Additional SQL injection check
    const sqlValidation = validateSQLInput(username);
    if (!sqlValidation.isValid) {
      debug.log("POST /api/auth/token - SQL injection attempt detected");
      await trackLoginAttempt(req, username, false);
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!username || !password) {
      debug.log("POST /api/auth/token - Missing username or password");
      return Response.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user by username (case insensitive)
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    // Check if user exists and has a password
    if (!user || !user.passwordHash) {
      debug.log(`POST /api/auth/token - User not found or no password hash: ${username}`);
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Check if the user has the USER role
    if (user.role !== "USER") {
      debug.log(`POST /api/auth/token - User ${username} has role ${user.role}, access denied`);
      return Response.json(
        { error: "Access denied. Your account does not have permission to log in." },
        { status: 403 }
      );
    }

    // Verify password
    const validPassword = await verify(user.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      debug.log(`POST /api/auth/token - Invalid password for user: ${username}`);
      await trackLoginAttempt(req, username, false, user.id);
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokens = await generateAuthTokens(user.id, user.role);

    // Update user's last active time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE"
      }
    });

    // Track successful login activity
    await trackLoginAttempt(req, username, true, user.id);

    // Return tokens and basic user info
    return Response.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    debug.error("Error in token generation:", error);
    return Response.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
