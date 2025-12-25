"use client";

import { useEffect, useState } from "react";
import debug from "@/lib/debug";

// Simple version that doesn't rely on React Query or other dependencies
export default function FirebaseInit() {
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Check if push notifications are supported
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const checkSupport = () => {
      // Check for service worker support
      if (!('serviceWorker' in navigator)) return false;
      // Check for notification support
      if (!('Notification' in window)) return false;
      // Check for Push API support
      if (!('PushManager' in window)) return false;
      return true;
    };

    const supported = checkSupport();
    setIsSupported(supported);

    if (!supported) {
      debug.log("Push notifications are not supported in this browser");
    }
  }, []);

  // Register the service worker only if push notifications are supported
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Don't try to register if push notifications aren't supported
    if (!isSupported) {
      debug.log("Not registering service worker because push notifications are not supported");
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Check if service workers are supported
        if ("serviceWorker" in navigator) {
          // Register the service worker
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
          });

          setServiceWorkerRegistration(registration);
          debug.log("Firebase service worker registered successfully");
        } else {
          debug.log("Service workers are not supported in this browser");
        }
      } catch (error) {
        debug.error("Error registering Firebase service worker:", error);
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  // This component doesn't render anything
  return null;
}
