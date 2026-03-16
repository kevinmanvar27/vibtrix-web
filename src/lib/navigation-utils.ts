/**
 * Utility functions for navigation
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to get navigation functions
 * @returns Navigation functions
 */
export function useNavigation() {
  const router = useRouter();

  /**
   * Navigate to a new page using client-side navigation
   * @param href The URL to navigate to
   * @param options Navigation options
   */
  const navigate = useCallback(
    (
      href: string,
      options?: {
        replace?: boolean;
        forceReload?: boolean;
      }
    ) => {
      const { replace = false, forceReload = false } = options || {};

      // If the URL is external, use window.location
      if (href.startsWith("http://") || href.startsWith("https://")) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      // If force reload is true, use window.location
      if (forceReload) {
        window.location.href = href;
        return;
      }

      // Otherwise, use router for client-side navigation
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [router]
  );

  /**
   * Refresh the current page
   * @param forceReload If true, force a full page reload
   */
  const refresh = useCallback(
    (forceReload = false) => {
      if (forceReload) {
        window.location.reload();
      } else {
        router.refresh();
      }
    },
    [router]
  );

  return {
    navigate,
    refresh,
  };
}

/**
 * Check if a URL is external
 * @param url The URL to check
 * @returns True if the URL is external, false otherwise
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Check if a URL is a special URL that requires a full page reload
 * @param url The URL to check
 * @returns True if the URL requires a full page reload, false otherwise
 */
export function requiresFullPageReload(url: string): boolean {
  // Add any paths that require a full page reload
  const fullReloadPaths = [
    "/login",
    "/logout",
    "/admin-login",
    "/admin/login",
  ];

  return fullReloadPaths.some((path) => url.startsWith(path));
}
