/**
 * API route for current user profile management
 * GET /api/users/me - Get current user profile
 * PUT /api/users/me - Update current user profile
 * DELETE /api/users/me - Delete current user account
 */
import { NextRequest } from "next/server";
import { verify, hash } from "@node-rs/argon2";
import prisma from "@/lib/prisma";
import { verifyJwtAuth } from "@/lib/jwt-middleware";
import { validateRequest } from "@/auth";
import { updateUserProfileSchema } from "@/lib/validation";
import { secureLogout } from "@/lib/auth-security";
import debug from "@/lib/debug";

/**
 * Helper function to get authenticated user from JWT or session
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  let user = await verifyJwtAuth(req);
  
  // Fallback to session-based authentication (for web)
  if (!user) {
    const sessionResult = await validateRequest();
    user = sessionResult.user;
  }
  
  return user;
}

/**
 * GET /api/users/me
 * Get current authenticated user's full profile
 */
export async function GET(req: NextRequest) {
  try {
    debug.log("GET /api/users/me - Starting request");

    const user = await getAuthenticatedUser(req);

    if (!user) {
      debug.log("GET /api/users/me - Unauthorized");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user profile with counts
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        whatsappNumber: true,
        dateOfBirth: true,
        createdAt: true,
        onlineStatus: true,
        lastActiveAt: true,
        role: true,
        isActive: true,
        // Privacy settings
        showOnlineStatus: true,
        isProfilePublic: true,
        showWhatsappNumber: true,
        showDob: true,
        hideYear: true,
        upiId: true,
        showUpiId: true,
        socialLinks: true,
        // Modeling feature fields
        interestedInModeling: true,
        photoshootPricePerDay: true,
        videoAdsParticipation: true,
        // Brand Ambassadorship feature fields
        interestedInBrandAmbassadorship: true,
        brandAmbassadorshipPricing: true,
        brandPreferences: true,
        // Counts
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!userProfile) {
      debug.log("GET /api/users/me - User not found");
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    debug.log(`GET /api/users/me - Profile retrieved for user: ${user.id}`);
    return Response.json(userProfile);

  } catch (error) {
    debug.error("GET /api/users/me - Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/me
 * Update current authenticated user's profile
 */
export async function PUT(req: NextRequest) {
  try {
    debug.log("PUT /api/users/me - Starting request");

    const user = await getAuthenticatedUser(req);

    if (!user) {
      debug.log("PUT /api/users/me - Unauthorized");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validation = updateUserProfileSchema.safeParse(body);
    if (!validation.success) {
      debug.log("PUT /api/users/me - Validation failed:", validation.error.errors);
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

    const data = validation.data;

    // Check if username is being changed and if it's already taken
    if (data.username && data.username !== user.username) {
      // Note: MySQL with default collation is case-insensitive by default
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: {
            id: user.id,
          },
        },
      });

      if (existingUsername) {
        debug.log(`PUT /api/users/me - Username already taken: ${data.username}`);
        return Response.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Build update data object
    const updateData: any = {};

    // Only include fields that are provided
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.upiId !== undefined) updateData.upiId = data.upiId;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks;
    
    // Modeling feature fields
    if (data.interestedInModeling !== undefined) updateData.interestedInModeling = data.interestedInModeling;
    if (data.photoshootPricePerDay !== undefined) updateData.photoshootPricePerDay = data.photoshootPricePerDay;
    if (data.videoAdsParticipation !== undefined) updateData.videoAdsParticipation = data.videoAdsParticipation;
    
    // Brand Ambassadorship feature fields
    if (data.interestedInBrandAmbassadorship !== undefined) updateData.interestedInBrandAmbassadorship = data.interestedInBrandAmbassadorship;
    if (data.brandAmbassadorshipPricing !== undefined) updateData.brandAmbassadorshipPricing = data.brandAmbassadorshipPricing;
    if (data.brandPreferences !== undefined) updateData.brandPreferences = data.brandPreferences;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        whatsappNumber: true,
        dateOfBirth: true,
        createdAt: true,
        onlineStatus: true,
        lastActiveAt: true,
        role: true,
        isActive: true,
        showOnlineStatus: true,
        isProfilePublic: true,
        showWhatsappNumber: true,
        showDob: true,
        hideYear: true,
        upiId: true,
        showUpiId: true,
        socialLinks: true,
        interestedInModeling: true,
        photoshootPricePerDay: true,
        videoAdsParticipation: true,
        interestedInBrandAmbassadorship: true,
        brandAmbassadorshipPricing: true,
        brandPreferences: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    debug.log(`PUT /api/users/me - Profile updated for user: ${user.id}`);
    return Response.json(updatedUser);

  } catch (error) {
    debug.error("PUT /api/users/me - Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me
 * Delete current authenticated user's account
 */
export async function DELETE(req: NextRequest) {
  try {
    debug.log("DELETE /api/users/me - Starting request");

    const user = await getAuthenticatedUser(req);

    if (!user) {
      debug.log("DELETE /api/users/me - Unauthorized");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body for password confirmation
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return Response.json(
        { error: "Password is required to delete account" },
        { status: 400 }
      );
    }

    // Get user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!userWithPassword?.passwordHash) {
      // User signed up with OAuth, no password to verify
      // For OAuth users, we might want a different verification method
      return Response.json(
        { error: "Cannot verify identity. Please contact support to delete your account." },
        { status: 400 }
      );
    }

    // Verify password
    const validPassword = await verify(userWithPassword.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      debug.log(`DELETE /api/users/me - Invalid password for user: ${user.id}`);
      return Response.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Invalidate all sessions and tokens
    await secureLogout(user.id);

    // Delete user (Prisma cascade will handle related data)
    await prisma.user.delete({
      where: { id: user.id },
    });

    debug.log(`DELETE /api/users/me - Account deleted for user: ${user.id}`);
    return Response.json({ message: "Account deleted successfully" });

  } catch (error) {
    debug.error("DELETE /api/users/me - Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
