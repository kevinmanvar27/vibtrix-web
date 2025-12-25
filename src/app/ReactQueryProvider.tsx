"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useCallback, useRef, useEffect } from "react";
import { startMeasure } from "@/lib/performance-monitor";

import debug from "@/lib/debug";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a memoized function to handle query client creation
  const createQueryClient = useCallback(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 minutes)
          gcTime: 10 * 60 * 1000, // 10 minutes (increased from 5 minutes)
          refetchOnWindowFocus: false,
          retry: 1,
          refetchOnMount: true, // Changed to true to ensure fresh data on navigation
          refetchOnReconnect: true, // Changed to true to ensure fresh data on reconnect
          // Improve performance by using structural sharing
          structuralSharing: true,
          // Add a default select function to transform data
          select: (data: any) => data,
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }, []);

  // Create the query client only once
  const [queryClient] = useState(createQueryClient);

  // Track performance metrics
  const performanceMetricsRef = useRef({
    queryCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  // Monitor query performance
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated') {
        performanceMetricsRef.current.queryCount++;

        // Track if this was a cache hit or miss
        // Note: The event structure has changed in newer versions of React Query
        // We'll simplify this tracking logic for now
        if (process.env.NODE_ENV === 'development' && performanceMetricsRef.current.queryCount % 10 === 0) {
          const metrics = performanceMetricsRef.current;
          const hitRate = metrics.queryCount > 0 ? (metrics.cacheHits / metrics.queryCount) * 100 : 0;
          debug.log(`[React Query] Cache hit rate: ${hitRate.toFixed(1)}% (${metrics.cacheHits}/${metrics.queryCount})`);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools disabled to reduce console output */}
    </QueryClientProvider>
  );
}