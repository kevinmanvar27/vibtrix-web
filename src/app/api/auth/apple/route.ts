/**
 * Apple Sign-In API endpoint for mobile apps
 * POST /api/auth/apple
 * 
 * Accepts Apple identity token from Flutter and returns JWT tokens
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateAuthTokens } from "@/lib/jwt";
import { generateIdFromEntropySize } from "lucia";
import { slugify } from "@/lib/utils";
import { trackLoginActivity } from "@/lib/track-login-activity";
import debug from "@/lib/debug";
import { z } from "zod";
import { jwtVerify, createRemoteJWKSet } from "jose";

// Apple's public key URL for token verification
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

// Validation schema for Apple Sign-In request
const appleSignInSchema = z.object({
  identityToken: z.string().min(1, "Identity token is required"),
  authorizationCode: z.string().optional(),
  fullName: z.object({
    givenName: z.string().optional(),
    familyName: z.string().optional(),
  }).optional(),
  email: z.string().email().optional(),
});

// Apple ID token payload interface
interface AppleIdTokenPayload {
  iss: string;           // Issuer (https://appleid.apple.com)
  aud: string;           // Your app's bundle ID
  exp: number;           // Expiration time
  iat: number;           // Issued at
  sub: string;           // User's unique Apple ID
  email?: string;        // User's email (only on first sign-in)
  email_verified?: string | boolean;
  is_private_email?: string | boolean;
  nonce?: string;
  nonce_supported?: boolean;
}

/**
 * Verify Apple identity token
 * @param identityToken - The identity token from Apple Sign-In
 * @returns Decoded token payload
 */
async function verifyAppleToken(identityToken: string): Promise<AppleIdTokenPayload> {
  try {
    // Create a JWKS client to fetch Apple's public keys
    const JWKS = createRemoteJWKSet(new URL(APPLE_KEYS_URL));
    
    // Verify the token
    const { payload } = await jwtVerify(identityToken, JWKS, {
      issuer: "https://appleid.apple.com",
      // audience is your app's bundle ID - should be configured in env
      audience: process.env.APPLE_BUNDLE_ID || process.env.APPLE_CLIENT_ID,
    });

    return payload as unknown as AppleIdTokenPayload;
  } catch (error) {
    debug.error("Apple token verification failed:", error);
    throw new Error("Invalid Apple identity token");
  }
}

/**
 * Generate a unique username from Apple user data
 */
async function generateUniqueUsername(
  fullName?: { givenName?: string; familyName?: string },
  email?: string
): Promise<string> {
  // Try to create username from name
  let baseUsername = "";
  
  if (fullName?.givenName) {
    baseUsername = slugify(fullName.givenName);
  } else if (email) {
    // Use email prefix as base
    baseUsername = slugify(email.split("@")[0]);
  } else {
    // Fallback to random
    baseUsername = "user";
  }

  // Ensure uniqueness
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    
    if (!existing) break;
    
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Safety limit
    if (counter > 1000) {
      username = `${baseUsername}${generateIdFromEntropySize(5)}`;
      break;
    }
  }

  return username;
}

/**
 * POST /api/auth/apple
 * Authenticate user with Apple Sign-In
 */
export async function POST(req: NextRequest) {
  try {
    debug.log("POST /api/auth/apple - Starting Apple Sign-In");

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = appleSignInSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/auth/apple - Validation failed:", validation.error.flatten());
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { identityToken, fullName, email: providedEmail } = validation.data;

    // Verify the Apple identity token
    let applePayload: AppleIdTokenPayload;
    try {
      applePayload = await verifyAppleToken(identityToken);
    } catch (error) {
      debug.error("POST /api/auth/apple - Token verification failed:", error);
      return Response.json(
        { error: "Invalid or expired Apple identity token" },
        { status: 401 }
      );
    }

    const appleId = applePayload.sub;
    // Email is only provided on first sign-in, use provided email as fallback
    const email = applePayload.email || providedEmail;

    debug.log(`POST /api/auth/apple - Apple ID: ${appleId}, Email: ${email ? "provided" : "not provided"}`);

    // Check if user already exists with this Apple ID
    let user = await prisma.user.findUnique({
      where: { appleId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    });

    if (user) {
      // Existing user - check if active
      if (!user.isActive) {
        debug.log(`POST /api/auth/apple - User ${user.id} is deactivated`);
        return Response.json(
          { error: "Account has been deactivated" },
          { status: 403 }
        );
      }

      // Only users with USER role can access the mobile app
      if (user.role !== "USER") {
        debug.log(`POST /api/auth/apple - User ${user.id} has non-USER role: ${user.role}`);
        return Response.json(
          { error: "Access denied for this account type" },
          { status: 403 }
        );
      }

      debug.log(`POST /api/auth/apple - Existing user found: ${user.id}`);
    } else {
      // Check if email is already used by another account
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, appleId: true, googleId: true },
        });

        if (existingEmailUser) {
          // Link Apple ID to existing account
          if (!existingEmailUser.appleId) {
            await prisma.user.update({
              where: { id: existingEmailUser.id },
              data: { appleId },
            });
            
            user = await prisma.user.findUnique({
              where: { id: existingEmailUser.id },
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
                isActive: true,
              },
            });

            debug.log(`POST /api/auth/apple - Linked Apple ID to existing account: ${existingEmailUser.id}`);
          } else {
            // Email already linked to different Apple account
            return Response.json(
              { error: "Email is already associated with another account" },
              { status: 409 }
            );
          }
        }
      }

      // Create new user if not found
      if (!user) {
        const userId = generateIdFromEntropySize(10);
        const username = await generateUniqueUsername(fullName, email);
        
        // Build display name from Apple data
        let displayName = "User";
        if (fullName?.givenName && fullName?.familyName) {
          displayName = `${fullName.givenName} ${fullName.familyName}`;
        } else if (fullName?.givenName) {
          displayName = fullName.givenName;
        } else if (email) {
          displayName = email.split("@")[0];
        }

        user = await prisma.user.create({
          data: {
            id: userId,
            appleId,
            email: email || null,
            username,
            displayName,
            role: "USER",
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
            isActive: true,
          },
        });

        debug.log(`POST /api/auth/apple - Created new user: ${user.id}`);
      }
    }

    // Generate JWT tokens
    const tokens = await generateAuthTokens(user.id, user.role);

    // Track login activity
    try {
      await trackLoginActivity(user.id, req, "SUCCESS");
    } catch (e) {
      debug.error("Failed to track login activity:", e);
      // Don't fail the request for tracking errors
    }

    debug.log(`POST /api/auth/apple - Success for user: ${user.id}`);

    return Response.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

  } catch (error) {
    debug.error("POST /api/auth/apple - Unexpected error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
