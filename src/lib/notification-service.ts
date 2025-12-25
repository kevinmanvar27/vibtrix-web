import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import debug from "@/lib/debug";

// Dynamically import Firebase Admin to avoid issues when Firebase is not configured
let sendMulticastPushNotification: any = null;

// Load Firebase Admin functions if needed
async function loadFirebaseAdmin() {
  try {
    const firebaseAdmin = await import("./firebase/admin");
    sendMulticastPushNotification = firebaseAdmin.sendMulticastPushNotification;
    return true;
  } catch (error) {
    debug.error("Error loading Firebase Admin:", error);
    return false;
  }
}

/**
 * Send a notification to a user
 * @param {object} params Notification parameters
 * @returns {Promise<object>} Created notification
 */
export async function sendNotification({
  recipientId,
  issuerId,
  postId,
  type,
}: {
  recipientId: string;
  issuerId: string;
  postId?: string;
  type: NotificationType;
}) {
  try {
    // Don't send notifications to yourself
    if (recipientId === issuerId) {
      return null;
    }

    // Check if the recipient has blocked the issuer
    const isBlocked = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: recipientId,
          blockedId: issuerId,
        },
      },
    });

    if (isBlocked) {
      debug.log(`User ${recipientId} has blocked ${issuerId}, skipping notification`);
      return null;
    }

    // Check user's notification preferences
    const preferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId: recipientId },
    });

    // If no preferences exist, use default values
    const userPrefs = preferences || {
      likeNotifications: true,
      followNotifications: true,
      commentNotifications: true,
      pushNotifications: true,
      competitionUpdates: true,
      messageNotifications: true,
    };

    // Check if this type of notification is enabled
    let shouldSend = true;
    switch (type) {
      case "LIKE":
        shouldSend = userPrefs.likeNotifications;
        break;
      case "FOLLOW":
      case "FOLLOW_REQUEST":
      case "FOLLOW_REQUEST_ACCEPTED":
      case "MUTUAL_FOLLOW":
        shouldSend = userPrefs.followNotifications;
        break;
      case "COMMENT":
        shouldSend = userPrefs.commentNotifications;
        break;
      case "COMPETITION_UPDATE":
        shouldSend = userPrefs.competitionUpdates;
        break;
      case "NEW_MESSAGE":
        shouldSend = userPrefs.messageNotifications;
        break;
      default:
        shouldSend = true;
    }

    if (!shouldSend) {
      debug.log(`User ${recipientId} has disabled ${type} notifications, skipping`);
      return null;
    }

    // Create the notification in the database
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        issuerId,
        postId,
        type,
        read: false,
      },
      include: {
        issuer: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        post: postId
          ? {
              select: {
                id: true,
                content: true,
              },
            }
          : undefined,
      },
    });

    // Check if push notifications are enabled
    if (userPrefs.pushNotifications) {
      await sendPushNotification(notification);
    }

    return notification;
  } catch (error) {
    debug.error("Error sending notification:", error);
    throw error;
  }
}

/**
 * Send a push notification for a database notification
 * @param {object} notification Database notification object
 */
async function sendPushNotification(notification: any) {
  try {
    // Check if push notifications are enabled in site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { pushNotificationsEnabled: true, firebaseEnabled: true },
    });

    if (!settings?.pushNotificationsEnabled || !settings?.firebaseEnabled) {
      debug.log("Push notifications are disabled in site settings");
      return;
    }

    // Get all active device tokens for the recipient
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: notification.recipientId,
        isActive: true,
      },
      select: {
        token: true,
      },
    });

    if (!deviceTokens.length) {
      debug.log(`No device tokens found for user ${notification.recipientId}`);
      return;
    }

    // Extract tokens
    const tokens = deviceTokens.map((dt) => dt.token);

    // Generate notification title and body based on type
    const { title, body, data } = generatePushNotificationContent(notification);

    // Load Firebase Admin if not already loaded
    if (!sendMulticastPushNotification) {
      const loaded = await loadFirebaseAdmin();
      if (!loaded) {
        debug.error("Failed to load Firebase Admin, cannot send push notifications");
        return;
      }
    }

    // Send the push notification
    await sendMulticastPushNotification(tokens, {
      title,
      body,
      data,
    });

    debug.log(`Push notification sent to ${tokens.length} devices for user ${notification.recipientId}`);
  } catch (error) {
    debug.error("Error sending push notification:", error);
    // Don't throw the error to prevent the main notification flow from failing
  }
}

/**
 * Generate push notification content based on notification type
 * @param {object} notification Database notification object
 * @returns {object} Notification content
 */
function generatePushNotificationContent(notification: any) {
  const issuerName = notification.issuer.displayName || notification.issuer.username;
  let title = "Vibtrix";
  let body = "You have a new notification";
  let data: Record<string, string> = {
    notificationId: notification.id,
    type: notification.type,
  };

  switch (notification.type) {
    case "LIKE":
      title = "New Like";
      body = `${issuerName} liked your post`;
      if (notification.postId) {
        data.postId = notification.postId;
      }
      break;
    case "FOLLOW":
      title = "New Follower";
      body = `${issuerName} started following you`;
      data.userId = notification.issuerId;
      break;
    case "COMMENT":
      title = "New Comment";
      body = `${issuerName} commented on your post`;
      if (notification.postId) {
        data.postId = notification.postId;
      }
      break;
    case "FOLLOW_REQUEST":
      title = "Follow Request";
      body = `${issuerName} wants to follow you`;
      data.userId = notification.issuerId;
      break;
    case "FOLLOW_REQUEST_ACCEPTED":
      title = "Follow Request Accepted";
      body = `${issuerName} accepted your follow request`;
      data.userId = notification.issuerId;
      break;
    case "MUTUAL_FOLLOW":
      title = "New Mutual Follow";
      body = `You and ${issuerName} are now following each other`;
      data.userId = notification.issuerId;
      break;
    case "COMPETITION_UPDATE":
      title = "Competition Update";
      body = "There's an update on a competition you're participating in";
      break;
    case "NEW_MESSAGE":
      title = "New Message";
      body = `${issuerName} sent you a message`;
      break;
    case "SYSTEM_NOTIFICATION":
      title = "Vibtrix";
      body = "You have a new system notification";
      break;
  }

  return { title, body, data };
}
