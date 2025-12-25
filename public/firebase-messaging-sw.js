// Firebase Cloud Messaging Service Worker

// Check if the browser supports service workers
if (!self.ServiceWorkerGlobalScope) {
  console.log("[firebase-messaging-sw.js] Service workers are not supported in this browser");
  // Exit early if service workers are not supported
  self.addEventListener("install", (event) => {
    self.skipWaiting();
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
} else {
  try {
    // Give the service worker access to Firebase Messaging.
    // Note that you can only use Firebase Messaging here. Other Firebase libraries
    // are not available in the service worker.
    importScripts(
      "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js",
    );
    importScripts(
      "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
    );

    // Firebase configuration will be set by the main thread
    let firebaseConfig = null;
    let messaging = null;

    // Listen for messages from the main thread
    self.addEventListener("message", (event) => {
      if (event.data && event.data.type === "FIREBASE_CONFIG") {
        firebaseConfig = event.data.config;

        // Initialize Firebase with the received config
        if (firebaseConfig) {
          try {
            firebase.initializeApp(firebaseConfig);
            console.log(
              "[firebase-messaging-sw.js] Firebase initialized with config from main thread",
            );

            // Retrieve an instance of Firebase Messaging
            messaging = firebase.messaging();
          } catch (error) {
            console.error("[firebase-messaging-sw.js] Error initializing Firebase:", error);
          }
        }
      }
    });
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Error loading Firebase scripts:", error);
  }
}

// Set up background message handler if messaging is available
try {
  // Only set up handlers if messaging is initialized
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "FIREBASE_CONFIG" && messaging) {
      // Handle background messages
      messaging.onBackgroundMessage((payload) => {
        console.log(
          "[firebase-messaging-sw.js] Received background message ",
          payload,
        );

        const notificationTitle = payload.notification.title;
        const notificationOptions = {
          body: payload.notification.body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: payload.data,
        };

        if (payload.notification.image) {
          notificationOptions.image = payload.notification.image;
        }

        self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  });
} catch (error) {
  console.error("[firebase-messaging-sw.js] Error setting up background message handler:", error);
}

// Handle notification click - this works even if Firebase messaging isn't available
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click: ", event);

  event.notification.close();

  // Get the notification data
  const data = event.notification.data;
  let url = "/notifications";

  // Determine the URL to open based on the notification type
  if (data) {
    if (data.postId) {
      url = `/posts/${data.postId}`;
    } else if (data.userId) {
      url = `/users/${data.userId}`;
    } else if (data.competitionId) {
      url = `/competitions/${data.competitionId}`;
    } else if (data.chatId) {
      url = `/messages/${data.chatId}`;
    }
  }

  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // If no window/tab is open with the target URL, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});
