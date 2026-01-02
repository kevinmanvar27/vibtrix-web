"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback, useEffect, useState, ReactNode, MouseEvent } from "react";

interface FastLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  title?: string;
}

/**
 * FastLink - Optimized Link component for instant navigation
 * 
 * Features:
 * - Prefetches on hover for instant navigation
 * - Uses client-side navigation for internal links
 * - Supports all standard Link props
 */
const FastLink = forwardRef<HTMLAnchorElement, FastLinkProps>(
  ({ href, children, className, onClick, prefetch = true, ...props }, ref) => {
    const router = useRouter();
    const [isPrefetched, setIsPrefetched] = useState(false);

    // Check if it's an external link
    const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:');

    // Prefetch on hover for even faster navigation
    const handleMouseEnter = useCallback(() => {
      if (!isPrefetched && !isExternal) {
        router.prefetch(href);
        setIsPrefetched(true);
      }
    }, [href, isPrefetched, isExternal, router]);

    // Handle click with optimistic navigation
    const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
      // Call custom onClick if provided
      if (onClick) {
        onClick(e);
      }

      // Don't intercept if:
      // - Event is already prevented
      // - Modifier keys are pressed (for opening in new tab, etc.)
      // - It's an external link
      // - Target is set to something other than _self
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        isExternal ||
        (props.target && props.target !== '_self')
      ) {
        return;
      }

      // Prevent default and use router for instant navigation
      e.preventDefault();
      router.push(href);
    }, [href, isExternal, onClick, props.target, router]);

    // For external links, use regular anchor
    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          className={className}
          onClick={onClick}
          target={props.target || "_blank"}
          rel={props.rel || "noopener noreferrer"}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={className}
        prefetch={prefetch}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

FastLink.displayName = "FastLink";

export { FastLink };
export default FastLink;
