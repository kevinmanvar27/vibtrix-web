/**
 * Google Sign-In API endpoint for mobile apps
 * POST /api/auth/google/mobile
 * 
 * Accepts Google ID token from Flutter and returns JWT tokens
 * Different from web OAuth flow which uses redirects and cookies
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateAuthTokens } from "@/lib/jwt";
import { generateIdFromEntropySize } from "lucia";
import { slugify } from "@/lib/utils";
import { trackLoginActivity } from "@/lib/track-login-activity";
import debug from "@/lib/debug";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Valid audience client IDs for token verification
// Mobile apps use their platform-specific client IDs, so we need to accept both
const VALID_AUDIENCE_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID, // Web client ID
  process.env.GOOGLE_ANDROID_CLIENT_ID, // Android client ID
  process.env.GOOGLE_IOS_CLIENT_ID, // iOS client ID (for future)
].filter(Boolean) as string[];

// Validation schema for Google Sign-In request
const googleSignInSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  accessToken: z.string().optional(), // Optional, for fetching additional profile data
});

// Google user info interface
interface GoogleUserInfo {
  sub: string;          // Google user ID
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * Verify Google ID token
 * @param idToken - The ID token from Google Sign-In
 * @returns Google user info
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
  console.log("🔑 verifyGoogleToken called");
  console.log("   GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...");
  console.log("   GOOGLE_ANDROID_CLIENT_ID:", process.env.GOOGLE_ANDROID_CLIENT_ID?.substring(0, 20) + "...");
  console.log("   Valid audiences:", VALID_AUDIENCE_CLIENT_IDS.length);
  
  try {
    console.log("   Calling googleClient.verifyIdToken...");
    // Accept tokens from web, Android, and iOS clients
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: VALID_AUDIENCE_CLIENT_IDS,
    });
    console.log("   Ticket received, getting payload...");
    
    const payload = ticket.getPayload();
    if (!payload) {
      console.log("   ❌ Payload is null/undefined!");
      throw new Error("Invalid token payload");
    }
    
    console.log("   ✅ Payload received:", payload.email, payload.sub);
    console.log("   Token audience (aud):", payload.aud);
    console.log("   Token authorized party (azp):", payload.azp);

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
    };
  } catch (error) {
    console.log("   ❌ verifyGoogleToken ERROR:", error);
    debug.error("Google token verification failed:", error);
    throw new Error("Invalid Google ID token");
  }
}

/**
 * Generate a unique username from Google user data
 */
async function generateUniqueUsername(
  name?: string,
  email?: string
): Promise<string> {
  // Try to create username from name or email
  let baseUsername = "";
  
  if (name) {
    baseUsername = slugify(name);
  } else if (email) {
    baseUsername = slugify(email.split("@")[0]);
  } else {
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
 * POST /api/auth/google/mobile
 * Authenticate user with Google Sign-In for mobile apps
 */
export async function POST(req: NextRequest) {
  console.log("\n========================================");
  console.log("🔵 POST /api/auth/google/mobile - RECEIVED");
  console.log("========================================");
  
  try {
    debug.log("POST /api/auth/google/mobile - Starting Google Sign-In");

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.log("📦 Request body received, idToken length:", body?.idToken?.length || 0);
    } catch (e) {
      console.log("❌ Failed to parse JSON body:", e);
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = googleSignInSchema.safeParse(body);
    if (!validation.success) {
      debug.log("POST /api/auth/google/mobile - Validation failed:", validation.error.flatten());
      return Response.json(
        { error: "Invalid request", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { idToken } = validation.data;

    // Verify the Google ID token
    console.log("🔐 Verifying Google ID token...");
    let googleUser: GoogleUserInfo;
    try {
      googleUser = await verifyGoogleToken(idToken);
      console.log("✅ Token verified! Google user:", googleUser.email, "sub:", googleUser.sub);
    } catch (error) {
      console.log("❌ Token verification FAILED:", error);
      debug.error("POST /api/auth/google/mobile - Token verification failed:", error);
      return Response.json(
        { error: "Invalid or expired Google ID token" },
        { status: 401 }
      );
    }

    const googleId = googleUser.sub;
    const email = googleUser.email;

    debug.log(`POST /api/auth/google/mobile - Google ID: ${googleId}, Email: ${email || "not provided"}`);

    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        isActive: true,
      },
    });

    if (user) {
      // Existing user - check if active
      if (!user.isActive) {
        debug.log(`POST /api/auth/google/mobile - User ${user.id} is deactivated`);
        return Response.json(
          { error: "Account has been deactivated" },
          { status: 403 }
        );
      }

      // Only users with USER role can access the mobile app
      if (user.role !== "USER") {
        debug.log(`POST /api/auth/google/mobile - User ${user.id} has non-USER role: ${user.role}`);
        return Response.json(
          { error: "Access denied for this account type" },
          { status: 403 }
        );
      }

      debug.log(`POST /api/auth/google/mobile - Existing user found: ${user.id}`);
    } else {
      // Check if email is already used by another account
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, googleId: true, appleId: true },
        });

        if (existingEmailUser) {
          // Link Google ID to existing account
          if (!existingEmailUser.googleId) {
            await prisma.user.update({
              where: { id: existingEmailUser.id },
              data: { 
                googleId,
                // Update avatar if not set
                avatarUrl: googleUser.picture || undefined,
              },
            });
            
            user = await prisma.user.findUnique({
              where: { id: existingEmailUser.id },
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                role: true,
                isActive: true,
              },
            });

            debug.log(`POST /api/auth/google/mobile - Linked Google ID to existing account: ${existingEmailUser.id}`);
          } else {
            // Email already linked to different Google account
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
        const username = await generateUniqueUsername(googleUser.name, email);
        
        // Build display name from Google data
        const displayName = googleUser.name || 
                           (googleUser.given_name && googleUser.family_name 
                             ? `${googleUser.given_name} ${googleUser.family_name}`
                             : googleUser.given_name || email?.split("@")[0] || "User");

        user = await prisma.user.create({
          data: {
            id: userId,
            googleId,
            email: email || null,
            username,
            displayName,
            avatarUrl: googleUser.picture || null,
            role: "USER",
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
          },
        });

        debug.log(`POST /api/auth/google/mobile - Created new user: ${user.id}`);
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

    debug.log(`POST /api/auth/google/mobile - Success for user: ${user.id}`);

    const response = {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    
    console.log("✅ SUCCESS! Returning response for user:", user.id);
    console.log("========================================\n");
    
    return Response.json(response);

  } catch (error) {
    console.log("❌ UNEXPECTED ERROR:", error);
    console.log("========================================\n");
    debug.error("POST /api/auth/google/mobile - Unexpected error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
