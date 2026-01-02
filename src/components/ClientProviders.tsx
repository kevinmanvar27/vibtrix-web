"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { StickeredMediaProvider } from "@/hooks/use-stickered-media-setting";

// Dynamically import components with no SSR - these load after main content
const FirebaseInit = dynamic(() => import("@/app/firebase-init-fixed"), {
  ssr: false,
  loading: () => null
});

const PushNotificationManager = dynamic(() => import("@/components/PushNotificationManagerFixed"), {
  ssr: false,
  loading: () => null
});

const PWAInstallPrompt = dynamic(() => import("@/components/PWAInstallPrompt"), {
  ssr: false,
  loading: () => null
});

const PWAInit = dynamic(() => import("@/app/pwa-init"), {
  ssr: false,
  loading: () => null
});

const DebugConfigInitializer = dynamic(() => import("@/components/DebugConfigInitializerFixed"), {
  ssr: false,
  loading: () => null
});

// Create QueryClient outside component to prevent recreation on re-renders
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Increase stale time for faster navigation
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: false, // Don't refetch on reconnect
      structuralSharing: true,
    },
  },
});

export default function ClientProviders({ children }: { children: ReactNode }) {
  // Create QueryClient only once
  const [queryClient] = useState(createQueryClient);

  // Hydration safety - use requestIdleCallback for non-critical components
  const [mounted, setMounted] = useState(false);
  const [deferredMounted, setDeferredMounted] = useState(false);

  useEffect(() => {
    // Mount immediately for main functionality
    setMounted(true);

    // Defer non-critical components until browser is idle
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        setDeferredMounted(true);
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      const timer = setTimeout(() => {
        setDeferredMounted(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <StickeredMediaProvider>
          {children}
          {/* Only render non-critical components after browser is idle */}
          {mounted && deferredMounted && (
            <>
              <DebugConfigInitializer />
              <FirebaseInit />
              <PushNotificationManager />
              <PWAInit />
              <PWAInstallPrompt />
            </>
          )}
        </StickeredMediaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
