"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useCallback, useRef, useEffect, ReactNode } from "react";
import debug from "@/lib/debug";

export default function ReactQueryProviderClient({
  children,
}: {
  children: ReactNode;
}) {
  // Create a memoized function to handle query client creation
  const createQueryClient = useCallback(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: false,
          retry: 1,
          refetchOnMount: true,
          refetchOnReconnect: true,
          structuralSharing: true,
          cacheTime: 10 * 60 * 1000, // 10 minutes
          suspense: false,
          select: (data: any) => data,
          onError: (error: any) => {
            if (error?.status === 401) {
              return;
            }
            if (process.env.NODE_ENV === 'development') {
              debug.error('Query error:', error);
            }
          },
        },
        mutations: {
          retry: 1,
          onError: (error: any) => {
            if (error?.status === 401) {
              return;
            }
            if (process.env.NODE_ENV === 'development') {
              debug.error('Mutation error:', error);
            }
          },
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
      if (event.type === 'queryUpdated') {
        performanceMetricsRef.current.queryCount++;

        // Track if this was a cache hit or miss
        if (event.action.type === 'success' && event.action.dataUpdatedAt === event.action.data) {
          performanceMetricsRef.current.cacheHits++;
        } else if (event.action.type === 'success') {
          performanceMetricsRef.current.cacheMisses++;
        }

        // Log performance metrics periodically in development
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
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
