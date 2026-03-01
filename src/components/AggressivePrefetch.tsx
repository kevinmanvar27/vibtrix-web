'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AGGRESSIVE PREFETCHING: Prefetch all main routes immediately on app load
 * This ensures instant navigation by loading pages in the background
 */
export default function AggressivePrefetch() {
  const router = useRouter();

  useEffect(() => {
    // List of all main routes to prefetch
    const routesToPrefetch = [
      '/',
      '/notifications',
      '/messages',
      '/bookmarks',
      '/search',
    ];

    // Prefetch all routes immediately
    routesToPrefetch.forEach((route) => {
      router.prefetch(route);
    });

    // Re-prefetch every 2 minutes to keep cache warm
    const interval = setInterval(() => {
      routesToPrefetch.forEach((route) => {
        router.prefetch(route);
      });
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
