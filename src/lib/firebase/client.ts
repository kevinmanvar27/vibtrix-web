// Firebase client configuration
import debug from '@/lib/debug';

// Dynamically import Firebase modules
let firebase: any = null;
let app: any = null;
let messaging: any = null;

// Check if the browser supports Firebase Cloud Messaging
function isMessagingSupported() {
  if (typeof window === 'undefined') return false;

  // Check for service worker support
  if (!('serviceWorker' in navigator)) return false;

  // Check for notification support
  if (!('Notification' in window)) return false;

  // Check for Push API support
  if (!('PushManager' in window)) return false;

  return true;
}

// Initialize Firebase if it's available
async function initializeFirebase() {
  if (typeof window === 'undefined') return false;

  // Check if the browser supports Firebase Cloud Messaging
  if (!isMessagingSupported()) {
    debug.log('This browser does not support Firebase Cloud Messaging');
    return false;
  }

  try {
    // Dynamically import Firebase modules
    const firebaseApp = await import('firebase/app');
    const firebaseMessaging = await import('firebase/messaging');

    firebase = {
      initializeApp: firebaseApp.initializeApp,
      getApps: firebaseApp.getApps,
      getApp: firebaseApp.getApp,
      getMessaging: firebaseMessaging.getMessaging,
      getToken: firebaseMessaging.getToken,
      onMessage: firebaseMessaging.onMessage,
    };

    // Get Firebase configuration from environment variables or database
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    // Initialize Firebase
    app = !firebase.getApps().length ? firebase.initializeApp(firebaseConfig) : firebase.getApp();

    try {
      // Initialize Firebase Cloud Messaging
      messaging = firebase.getMessaging(app);
      debug.log('Firebase initialized successfully with messaging');
    } catch (messagingError) {
      debug.error('Error initializing Firebase Messaging:', messagingError);
      // Firebase is initialized but messaging is not supported
      debug.log('Firebase initialized without messaging support');
      return true;
    }

    return true;
  } catch (error) {
    debug.error('Error initializing Firebase:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported in this browser
 * @returns {boolean} Whether push notifications are supported
 */
export function isPushNotificationsSupported(): boolean {
  return isMessagingSupported();
}

/**
 * Request permission to receive push notifications
 * @returns {Promise<string|null>} FCM token or null if permission denied or not supported
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if push notifications are supported
    if (!isPushNotificationsSupported()) {
      debug.log('Push notifications are not supported in this browser');
      return null;
    }

    // Initialize Firebase if not already initialized
    if (!firebase) {
      const initialized = await initializeFirebase();
      if (!initialized) return null;
    }

    if (!messaging) {
      debug.log('Firebase messaging is not available');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      debug.log('Notification permission denied');
      return null;
    }

    try {
      // Get FCM token
      const currentToken = await firebase.getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
        debug.log('FCM token obtained:', currentToken);
        return currentToken;
      } else {
        debug.error('No FCM token available');
        return null;
      }
    } catch (tokenError) {
      debug.error('Error getting FCM token:', tokenError);
      return null;
    }
  } catch (error) {
    debug.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Register a callback for foreground messages
 * @param {Function} callback Function to call when a message is received
 * @returns {Function} Unsubscribe function
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  // Check if push notifications are supported
  if (!isPushNotificationsSupported()) {
    debug.log('Push notifications are not supported in this browser');
    return () => {}; // Return empty function as unsubscribe
  }

  if (!firebase || !messaging) {
    debug.error('Firebase not initialized');
    return () => {}; // Return empty function as unsubscribe
  }

  try {
    return firebase.onMessage(messaging, (payload: any) => {
      debug.log('Message received in foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    debug.error('Error setting up foreground message handler:', error);
    return () => {}; // Return empty function as unsubscribe
  }
}

/**
 * Register the FCM token with the server
 * @param {string} token FCM token
 * @param {string} deviceType Device type (ios, android, web)
 * @returns {Promise<boolean>} Success status
 */
export async function registerFCMToken(token: string, deviceType: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, deviceType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register FCM token: ${response.statusText}`);
    }

    debug.log('FCM token registered with server');
    return true;
  } catch (error) {
    debug.error('Error registering FCM token with server:', error);
    return false;
  }
}

// Initialize Firebase when this module is imported
if (typeof window !== 'undefined') {
  initializeFirebase().catch(error => {
    debug.error('Failed to initialize Firebase on import:', error);
  });
}

export default app;
