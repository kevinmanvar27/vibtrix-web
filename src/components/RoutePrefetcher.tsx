"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Prefetch critical routes on app load for instant navigation
 */
export default function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch critical routes after initial load
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // Prefetch main navigation routes
        router.prefetch('/');
        router.prefetch('/notifications');
        router.prefetch('/messages');
        router.prefetch('/competitions');
        router.prefetch('/bookmarks');
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        router.prefetch('/');
        router.prefetch('/notifications');
        router.prefetch('/messages');
        router.prefetch('/competitions');
        router.prefetch('/bookmarks');
      }, 1000);
    }
  }, [router]);

  return null;
}
