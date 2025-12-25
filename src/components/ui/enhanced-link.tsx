"use client";

import { cn } from "@/lib/utils";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React, { forwardRef } from "react";

export interface EnhancedLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
  /**
   * If true, the link will force a full page reload
   * Use this only for authentication-related links or when absolutely necessary
   */
  forceReload?: boolean;
}

/**
 * Enhanced Link component that ensures proper client-side navigation
 * This component wraps Next.js Link component and adds additional functionality
 */
const EnhancedLink = forwardRef<HTMLAnchorElement, EnhancedLinkProps>(
  (
    {
      href,
      prefetch,
      replace,
      scroll,
      shallow,
      locale,
      forceReload = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const router = useRouter();

    // Handle click event
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow default behavior if:
      // - The event is modified (e.g., Ctrl+Click to open in new tab)
      // - The link is external (starts with http or https)
      // - forceReload is true
      const isModifiedEvent =
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
      const isExternalLink =
        href.startsWith("http://") || href.startsWith("https://");

      if (isModifiedEvent || isExternalLink || forceReload) {
        return;
      }

      // Prevent default behavior for internal links
      e.preventDefault();

      // Use router for client-side navigation
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    };

    // For external links or links that need a full page reload, use a regular anchor tag
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      forceReload
    ) {
      return (
        <a
          ref={ref}
          href={href}
          className={className}
          target={props.target || "_self"}
          rel={props.rel || "noopener noreferrer"}
          {...props}
        >
          {children}
        </a>
      );
    }

    // For internal links, use Next.js Link component
    return (
      <NextLink
        ref={ref}
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        locale={locale}
        className={cn(className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);

EnhancedLink.displayName = "EnhancedLink";

export { EnhancedLink };
