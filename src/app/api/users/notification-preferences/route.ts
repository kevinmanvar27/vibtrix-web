import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
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
 * GET /api/users/notification-preferences
 * Retrieve notification preferences for the current user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create notification preferences
    const preferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist yet, return default values
    if (!preferences) {
      return Response.json({
        likeNotifications: true,
        followNotifications: true,
        commentNotifications: true,
        pushNotifications: true,
        competitionUpdates: true,
        messageNotifications: true,
      });
    }

    return Response.json({
      likeNotifications: preferences.likeNotifications,
      followNotifications: preferences.followNotifications,
      commentNotifications: preferences.commentNotifications,
      pushNotifications: preferences.push_notifications,
      competitionUpdates: preferences.competition_updates,
      messageNotifications: preferences.message_notifications,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/users/notification-preferences
 * Update notification preferences for the current user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.error("Unauthorized access attempt to notification preferences");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log("User authenticated:", user.id, user.username);

    let requestData;
    try {
      requestData = await request.json();
      debug.log("Received notification preferences update request:", requestData);
    } catch (e) {
      debug.error("Failed to parse request JSON:", e);
      return Response.json({ error: "Invalid JSON in request" }, { status: 400 });
    }

    // Create an update data object with only the fields that are present in the request
    const updateData: any = {};
    const validFields = [
      'likeNotifications',
      'followNotifications',
      'commentNotifications',
      'push_notifications',
      'competition_updates',
      'message_notifications'
    ];

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

    debug.log("Updating notification preferences for user:", user.id, "with data:", updateData);

    // Get existing preferences or create default values
    const existingPreferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // Prepare create data with defaults if needed
    const createData = {
      userId: user.id,
      likeNotifications: true,
      followNotifications: true,
      commentNotifications: true,
      push_notifications: true,
      competition_updates: true,
      message_notifications: true,
      ...updateData
    };

    // Update or create notification preferences
    const preferences = await prisma.userNotificationPreferences.upsert({
      where: { userId: user.id },
      update: updateData,
      create: createData,
    });

    debug.log("Notification preferences updated successfully:", preferences);

    return Response.json({
      likeNotifications: preferences.likeNotifications,
      followNotifications: preferences.followNotifications,
      commentNotifications: preferences.commentNotifications,
      pushNotifications: preferences.push_notifications,
      competitionUpdates: preferences.competition_updates,
      messageNotifications: preferences.message_notifications,
    });
  } catch (error) {
    debug.error("Error updating notification preferences:", error);
    return Response.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
