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
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "vidibattle-fd3b2",
  });
}

// Get Firebase Auth instance
const firebaseAuth = admin.auth();

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
 * Verify Firebase ID token
 * @param idToken - The ID token from Firebase Auth
 * @returns Google user info
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
  debug.log("verifyGoogleToken called - using Firebase Admin SDK");
  
  try {
    // Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    
    debug.log("Token verified successfully for:", decodedToken.email);
    debug.log("Token details:", {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      provider: decodedToken.firebase?.sign_in_provider,
    });

    // Extract user info from decoded token
    // IMPORTANT: Use the actual Google user ID from firebase.identities, not the Firebase UID
    const googleUserId = decodedToken.firebase?.identities?.['google.com']?.[0] || decodedToken.uid;
    
    return {
      sub: googleUserId, // Use Google user ID, not Firebase UID
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name,
      given_name: decodedToken.given_name,
      family_name: decodedToken.family_name,
      picture: decodedToken.picture,
    };
  } catch (error: any) {
    debug.error("Firebase token verification failed:", error);
    debug.error("Error code:", error.code);
    debug.error("Error message:", error.message);
    throw new Error("Invalid or expired Google ID token");
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
  try {
    debug.log("POST /api/auth/google/mobile - Starting Google Sign-In");

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      debug.log("Request body received, idToken length:", body?.idToken?.length || 0);
    } catch (e) {
      debug.error("Failed to parse JSON body:", e);
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
    debug.log("Verifying Google ID token...");
    let googleUser: GoogleUserInfo;
    try {
      googleUser = await verifyGoogleToken(idToken);
      debug.log("Token verified! Google user:", googleUser.email);
    } catch (error) {
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
          // Check if it's the same Google account or different
          if (!existingEmailUser.googleId) {
            // No Google ID linked yet - link it now
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
          } else if (existingEmailUser.googleId === googleId) {
            // Same Google account - allow login
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
            
            debug.log(`POST /api/auth/google/mobile - Logging in existing user: ${existingEmailUser.id}`);
          } else {
            // Different Google account with same email - this is a conflict
            debug.error(`POST /api/auth/google/mobile - Email conflict: ${email} already linked to different Google ID`);
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
    
    return Response.json(response);

  } catch (error) {
    debug.error("POST /api/auth/google/mobile - Unexpected error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
