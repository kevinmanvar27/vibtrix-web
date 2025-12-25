"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Props for the RedirectIfLoggedIn component
 */
interface RedirectIfLoggedInProps {
  /** Whether the user is logged in */
  isLoggedIn: boolean;
  /** Whether the user has admin privileges */
  isAdmin: boolean;
  /** URL to redirect to if user is logged in as admin */
  redirectTo: string;
}

/**
 * Component that redirects admin users who are already logged in
 * Used on login pages to avoid showing login form to authenticated users
 */
export default function RedirectIfLoggedIn({
  isLoggedIn,
  isAdmin,
  redirectTo
}: RedirectIfLoggedInProps) {
  const router = useRouter();

  /**
   * Effect to check login status and redirect if needed
   * Redirects admin users who are already logged in to the specified URL
   */
  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      // Redirect admin users who are already logged in
      // For admin authentication, we still need a full page refresh to ensure the session is properly recognized
      // This is an exception to the SPA pattern, but necessary for security
      window.location.href = redirectTo;
    }
  }, [isLoggedIn, isAdmin, redirectTo]);

  return null;
}
