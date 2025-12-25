"use client";

import React, { ReactNode, useCallback } from "react";
import { useSession } from "@/app/(main)/SessionProvider";
import { useGuestSession } from "./GuestSessionProvider";

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  returnUrl?: string;
}

/**
 * Component that wraps interactive elements requiring authentication
 * If user is not logged in, clicking will redirect to Google login
 */
export default function RequireAuth({
  children,
  fallback,
  returnUrl
}: RequireAuthProps) {
  // Get session information
  const { isLoggedIn } = useSession();

  // Get the guest session for redirecting
  const { redirectToLogin } = useGuestSession();

  const handleAuthRequired = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    redirectToLogin(returnUrl);
  }, [redirectToLogin, returnUrl]);

  // If logged in, just render the children
  if (isLoggedIn) {
    return <>{children}</>;
  }

  // If fallback is provided, render that instead
  if (fallback) {
    return <div onClick={handleAuthRequired}>{fallback}</div>;
  }

  // Otherwise, clone the children and add the auth handler
  // This preserves the original component's styling and behavior
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onClick: handleAuthRequired,
        style: { ...child.props.style, cursor: 'pointer' },
      });
    }
    return child;
  });
}
