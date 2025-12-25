"use client";

import { useEffect, useState } from "react";
import debug from "@/lib/debug";

export default function PushNotificationManagerFixed() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check if push notifications are supported in this browser
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Only check once
    if (isSupported !== null) return;

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
  }, [isSupported]);

  // This component doesn't render anything
  return null;
}
