"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import MobileNavBar from "./MobileNavBar";

import debug from "@/lib/debug";

export default function MobileNavBarWrapper() {
  // Create a new QueryClient instance for this component
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

  // Force mobile navigation to be visible on small screens
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;

  // Log for debugging
  if (typeof window !== 'undefined') {
    debug.log("MobileNavBarWrapper - Window width:", window.innerWidth);
    debug.log("MobileNavBarWrapper - Is mobile view:", isMobileView);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mobile-nav-container md:hidden sm:hidden">
        <MobileNavBar />
      </div>
    </QueryClientProvider>
  );
}
