import prisma from "@/lib/prisma";
import { NotificationCountInfo } from "@/lib/types";
import { NotificationType } from "@prisma/client";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the current user
 * Respects user notification preferences
 * Requires authentication (JWT or session)
 */
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user notification preferences
    const preferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, use default values
    const userPrefs = preferences || {
      likeNotifications: true,
      followNotifications: true,
      commentNotifications: true,
      push_notifications: true,
      competition_updates: true,
      message_notifications: true,
    };

    // Create a list of notification types to exclude based on user preferences
    // For now, we only filter out follow-related notifications when disabled
    const excludedTypes: NotificationType[] = [];

    // Only check follow notifications setting
    if (!userPrefs.followNotifications) {
      excludedTypes.push("FOLLOW");
      excludedTypes.push("FOLLOW_REQUEST");
      excludedTypes.push("FOLLOW_REQUEST_ACCEPTED");
      excludedTypes.push("MUTUAL_FOLLOW");
    }

    // Other notification types will be shown regardless of settings
    // We'll keep the code commented for future reference

    // if (!userPrefs.likeNotifications) {
    //   excludedTypes.push("LIKE");
    // }

    // if (!userPrefs.commentNotifications) {
    //   excludedTypes.push("COMMENT");
    // }

    // if (!userPrefs.competition_updates) {
    //   excludedTypes.push("COMPETITION_UPDATE");
    // }

    // if (!userPrefs.message_notifications) {
    //   excludedTypes.push("NEW_MESSAGE");
    // }

    // Count unread notifications, filtering out types that the user has disabled
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
        type: {
          notIn: excludedTypes.length > 0 ? excludedTypes : undefined,
        },
      },
    });

    const data: NotificationCountInfo = {
      unreadCount,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
