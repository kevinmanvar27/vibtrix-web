import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

/**
 * Cleans up duplicate notifications in the database
 * Keeps the most recent notification for each unique combination of issuer, recipient, type, and post (if applicable)
 */
export async function cleanDuplicateNotifications() {
  try {
    // Get all notifications
    const allNotifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Create a map to track unique notification signatures
    const uniqueNotifications = new Map();
    const duplicateIds = [];

    // Process notifications (keeping the most recent for each unique combination)
    for (const notification of allNotifications) {
      // Create a unique signature for each notification type
      let signature;
      
      if (notification.postId) {
        // For notifications related to posts (LIKE, COMMENT, SHARE)
        signature = `${notification.issuerId}-${notification.recipientId}-${notification.type}-${notification.postId}`;
      } else {
        // For notifications not related to posts (FOLLOW, FOLLOW_REQUEST, FOLLOW_REQUEST_ACCEPTED)
        signature = `${notification.issuerId}-${notification.recipientId}-${notification.type}`;
      }

      // If we've seen this signature before, it's a duplicate
      if (uniqueNotifications.has(signature)) {
        duplicateIds.push(notification.id);
      } else {
        // Otherwise, mark this as the first occurrence
        uniqueNotifications.set(signature, notification.id);
      }
    }

    if (duplicateIds.length > 0) {
      // Delete all duplicates
      await prisma.notification.deleteMany({
        where: {
          id: {
            in: duplicateIds,
          },
        },
      });
      
      return { cleaned: true, count: duplicateIds.length };
    }

    return { cleaned: false, count: 0 };
  } catch (error) {
    debug.error("Error cleaning duplicate notifications:", error);
    throw error;
  }
}
