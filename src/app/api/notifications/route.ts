import prisma from "@/lib/prisma";
import { notificationsInclude, NotificationsPage } from "@/lib/types";
import { NextRequest } from "next/server";
import { NotificationType } from "@prisma/client";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 * Respects user notification preferences
 * Requires authentication (JWT or session)
 */
export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

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

    debug.log("Excluded notification types based on user preferences:", excludedTypes);

    // Get notifications, filtering out types that the user has disabled
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
        type: {
          notIn: excludedTypes.length > 0 ? excludedTypes : undefined,
        },
      },
      include: notificationsInclude,
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // For FOLLOW_REQUEST notifications, fetch the associated follow request ID
    const notificationsWithFollowRequests = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.type === "FOLLOW_REQUEST") {
          // Find the associated follow request
          const followRequest = await prisma.followRequest.findFirst({
            where: {
              requesterId: notification.issuerId,
              recipientId: user.id,
              status: "PENDING",
            },
            select: { id: true },
          });

          if (followRequest) {
            return {
              ...notification,
              followRequestId: followRequest.id,
            };
          }
        }
        return notification;
      })
    );

    const nextCursor =
      notifications.length > pageSize ? notifications[pageSize].id : null;

    const data: NotificationsPage = {
      notifications: notificationsWithFollowRequests.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
