"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/register-sw";
import debug from "@/lib/debug";

export default function PWAInit() {
  useEffect(() => {
    // Register the service worker
    registerServiceWorker();
    
    debug.log("PWA initialization complete");
  }, []);

  // This component doesn't render anything
  return null;
}
