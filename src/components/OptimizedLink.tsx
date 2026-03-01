"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComponentProps, MouseEvent, useCallback, useTransition, useEffect } from "react";

/**
 * Optimized Link component for instant navigation
 * - Prefetches immediately on mount for faster navigation
 * - Uses React 18 transitions for smoother UI updates
 */
export default function OptimizedLink({
  href,
  prefetch = true,
  children,
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Prefetch immediately on mount for instant navigation
  useEffect(() => {
    if (prefetch && typeof href === 'string') {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Call original onClick if provided
      if (onClick) {
        onClick(e);
      }

      // If default is prevented or it's a modified click, let Next.js handle it
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }

      // Prevent default and use router.push for instant navigation
      e.preventDefault();
      
      // Use startTransition for non-blocking navigation
      startTransition(() => {
        router.push(href.toString());
      });
    },
    [href, onClick, router]
  );

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
