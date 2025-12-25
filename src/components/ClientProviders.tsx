"use client";

import { ReactNode, useState, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import dynamic from "next/dynamic";
import { StickeredMediaProvider } from "@/hooks/use-stickered-media-setting";

// Dynamically import components with no SSR
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

export default function ClientProviders({ children }: { children: ReactNode }) {
  // Create QueryClient in a client component
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnMount: true,
        refetchOnReconnect: true,
        structuralSharing: true,
      },
    },
  }));

  // Hydration safety
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted state after a short delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setMounted(true);
    }, 10);

    return () => clearTimeout(timer);
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
          {/* Only render dynamic components after mounting to prevent hydration issues */}
          {mounted && (
            <>
              <DebugConfigInitializer />
              <FirebaseInit />
              <PushNotificationManager />
              <PWAInit />
              <PWAInstallPrompt />
            </>
          )}
          {children}
        </StickeredMediaProvider>
        {/* React Query DevTools disabled to reduce console output */}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
