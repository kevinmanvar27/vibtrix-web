import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import debug from "@/lib/debug";

/**
 * Helper function to get authenticated user from JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }

  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

/**
 * GET /api/users/privacy-settings
 * Fetch privacy settings for the current user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(req: NextRequest) {
  try {
    const luciaUser = await getAuthenticatedUser(req);

    if (!luciaUser) {
      debug.error("Unauthorized access attempt to privacy settings");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the full user object from the database since Lucia user doesn't have all fields
    const user = await prisma.user.findUnique({
      where: { id: luciaUser.id },
      select: {
        showOnlineStatus: true,
        isProfilePublic: true,
        showWhatsappNumber: true,
        showDob: true,
        hideYear: true,
        showUpiId: true,
      }
    });

    if (!user) {
      debug.error("User not found in database");
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      showOnlineStatus: user.showOnlineStatus,
      isProfilePublic: user.isProfilePublic,
      showWhatsappNumber: user.showWhatsappNumber,
      showDob: user.showDob,
      hideYear: user.hideYear,
      showUpiId: user.showUpiId,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/users/privacy-settings
 * Update privacy settings for the current user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(request: NextRequest) {
  try {
    const luciaUser = await getAuthenticatedUser(request);

    if (!luciaUser) {
      debug.error("Unauthorized access attempt to privacy settings");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the full user object from the database since Lucia user doesn't have all fields
    const fullUser = await prisma.user.findUnique({
      where: { id: luciaUser.id }
    });

    if (!fullUser) {
      debug.error("User not found in database");
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    debug.log("User authenticated:", fullUser.id, fullUser.username);

    let requestData;
    try {
      requestData = await request.json();
      debug.log("Received privacy settings update request:", requestData);
    } catch (e) {
      debug.error("Failed to parse request JSON:", e);
      return Response.json({ error: "Invalid JSON in request" }, { status: 400 });
    }

    // Create an update data object with only the fields that are present in the request
    const updateData: any = {};
    const validFields = ['showOnlineStatus', 'isProfilePublic', 'showWhatsappNumber', 'showDob', 'hideYear', 'showUpiId'];

    // Validate each field that is present in the request
    for (const field of validFields) {
      if (field in requestData) {
        if (typeof requestData[field] !== 'boolean') {
          debug.error(`Invalid type for ${field}:`, typeof requestData[field]);
          return Response.json({
            error: "Invalid input",
            details: { [field]: `Expected boolean, got ${typeof requestData[field]}` }
          }, { status: 400 });
        }
        updateData[field] = requestData[field];
      }
    }

    // If no valid fields were provided, return an error
    if (Object.keys(updateData).length === 0) {
      debug.error("No valid fields provided in request");
      return Response.json({ error: "No valid fields provided" }, { status: 400 });
    }

    // Special case: if showDob is being set to false, also set hideYear to false
    if ('showDob' in updateData && updateData.showDob === false) {
      updateData.hideYear = false;
    }

    // Special case: if hideYear is true, ensure showFullDob is false
    if ('hideYear' in updateData && updateData.hideYear === true) {
      updateData.showFullDob = false;
    }

    debug.log("Updating privacy settings for user:", fullUser.id, "with data:", updateData);

    // Update user privacy settings with only the fields that were provided
    const updatedUser = await prisma.user.update({
      where: { id: fullUser.id },
      data: updateData,
      select: {
        showOnlineStatus: true,
        isProfilePublic: true,
        showWhatsappNumber: true,
        showDob: true,
        hideYear: true,
        showUpiId: true,
      }
    });

    debug.log("Privacy settings updated successfully:", updatedUser);

    // Get the current user's username to invalidate their profile page cache
    const currentUser = await prisma.user.findUnique({
      where: { id: fullUser.id },
      select: { username: true }
    });

    if (currentUser) {
      // Invalidate the user's profile page cache
      revalidatePath(`/users/${currentUser.username}`);
      debug.log("Cache invalidated for user profile:", currentUser.username);
    }

    return Response.json({
      showOnlineStatus: updatedUser.showOnlineStatus,
      isProfilePublic: updatedUser.isProfilePublic,
      showWhatsappNumber: updatedUser.showWhatsappNumber,
      showDob: updatedUser.showDob,
      hideYear: updatedUser.hideYear,
      showUpiId: updatedUser.showUpiId,
    });
  } catch (error) {
    debug.error("Error updating privacy settings:", error);
    return Response.json({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}