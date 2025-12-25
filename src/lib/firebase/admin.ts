// Firebase Admin SDK configuration
import debug from '@/lib/debug';

// Dynamically import Firebase Admin modules
let admin: any = null;
let adminApp: any = null;

// Initialize Firebase Admin SDK
async function initializeFirebaseAdmin() {
  if (admin) return admin;

  try {
    // Dynamically import Firebase Admin modules
    const firebaseAdmin = await import('firebase-admin/app');
    const firebaseMessaging = await import('firebase-admin/messaging');

    admin = {
      initializeApp: firebaseAdmin.initializeApp,
      getApps: firebaseAdmin.getApps,
      cert: firebaseAdmin.cert,
      getMessaging: firebaseMessaging.getMessaging,
    };

    if (!admin.getApps().length) {
      // Check if we have environment variables for Firebase Admin
      if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
        adminApp = admin.initializeApp({
          credential: admin.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        debug.log('Firebase Admin SDK initialized with environment variables');
      } else {
        // Fallback to environment variables for service account
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
          adminApp = admin.initializeApp({
            credential: admin.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
          debug.log('Firebase Admin SDK initialized with environment variables fallback');
        } else {
          debug.error('Firebase Admin SDK configuration missing');
          throw new Error('Firebase Admin SDK configuration is incomplete. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
        }
      }
    } else {
      adminApp = admin.getApps()[0];
    }

    return admin;
  } catch (error) {
    debug.error('Error initializing Firebase Admin SDK:', error);
    return null;
  }
}

/**
 * Send a push notification to a specific device
 * @param {string} token FCM token
 * @param {object} notification Notification payload
 * @returns {Promise<string>} Message ID
 */
export async function sendPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }
) {
  try {
    // Initialize Firebase Admin if not already initialized
    const firebaseAdmin = await initializeFirebaseAdmin();
    if (!firebaseAdmin || !adminApp) {
      debug.error('Firebase Admin SDK not initialized');
      return null;
    }

    const messaging = firebaseAdmin.getMessaging(adminApp);

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: notification.data || {},
      webpush: {
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      },
    };

    const response = await messaging.send(message);
    debug.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    debug.error('Error sending push notification:', error);
    return null;
  }
}

/**
 * Send a push notification to multiple devices
 * @param {string[]} tokens FCM tokens
 * @param {object} notification Notification payload
 * @returns {Promise<BatchResponse>} Batch response
 */
export async function sendMulticastPushNotification(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, string>;
  }
) {
  try {
    if (!tokens.length) {
      debug.log('No tokens provided for multicast push notification');
      return { successCount: 0, failureCount: 0 };
    }

    // Initialize Firebase Admin if not already initialized
    const firebaseAdmin = await initializeFirebaseAdmin();
    if (!firebaseAdmin || !adminApp) {
      debug.error('Firebase Admin SDK not initialized');
      return { successCount: 0, failureCount: tokens.length };
    }

    const messaging = firebaseAdmin.getMessaging(adminApp);

    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: notification.data || {},
      webpush: {
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
      },
    };

    const response = await messaging.sendMulticast(message);
    debug.log(
      `Successfully sent multicast message. Success: ${response.successCount}, Failure: ${response.failureCount}`
    );
    return response;
  } catch (error) {
    debug.error('Error sending multicast push notification:', error);
    return { successCount: 0, failureCount: tokens.length };
  }
}

// Initialize Firebase Admin when this module is imported
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  initializeFirebaseAdmin().catch(error => {
    debug.error('Failed to initialize Firebase Admin on import:', error);
  });
}

export default adminApp;
