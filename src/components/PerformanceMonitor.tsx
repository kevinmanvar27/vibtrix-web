"use client";

import { initPerformanceMonitoring } from "@/lib/performance-monitor";
import { useEffect } from "react";

import debug from "@/lib/debug";

/**
 * Component that initializes performance monitoring
 * This component should be added to the root layout
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    try {
      // Initialize performance monitoring
      initPerformanceMonitoring();

      // Log initialization in development
      if (process.env.NODE_ENV === 'development') {
        debug.log('[Performance] Monitoring initialized');
      }
    } catch (error) {
      // Silently fail in production, log in development
      if (process.env.NODE_ENV === 'development') {
        debug.error('[Performance] Failed to initialize monitoring:', error);
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}
