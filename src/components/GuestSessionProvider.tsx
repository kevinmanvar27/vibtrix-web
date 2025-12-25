"use client";

import React, { createContext, useContext } from "react";
import { useRouter } from "next/navigation";

// Create a context for guest users
interface GuestSessionContext {
  isGuest: boolean;
  redirectToLogin: (returnUrl?: string) => void;
}

const GuestSessionContext = createContext<GuestSessionContext | null>(null);

export default function GuestSessionProvider({
  children,
}: React.PropsWithChildren) {
  const router = useRouter();

  // Function to redirect to Google login with the current URL as the return URL
  const redirectToLogin = (returnUrl?: string) => {
    const currentUrl = returnUrl || window.location.href;
    // Use router.push for client-side navigation instead of window.location
    router.push(`/login/google?from=${encodeURIComponent(currentUrl)}`);
  };

  const value: GuestSessionContext = {
    isGuest: true,
    redirectToLogin,
  };

  return (
    <GuestSessionContext.Provider value={value}>
      {children}
    </GuestSessionContext.Provider>
  );
}

// Hook to use the guest session context
export function useGuestSession() {
  const router = useRouter();
  const context = useContext(GuestSessionContext);

  if (!context) {
    // Return a default context instead of throwing
    return {
      isGuest: false,
      redirectToLogin: (returnUrl?: string) => {
        const currentUrl = returnUrl || window.location.href;
        // Use router.push for client-side navigation
        router.push(`/login/google?from=${encodeURIComponent(currentUrl)}`);
      }
    };
  }
  return context;
}
