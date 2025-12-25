import { type ClassValue, clsx } from "clsx";
import { formatDate, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

import debug from "@/lib/debug";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date | string) {
  // Ensure 'from' is a Date object
  const fromDate = from instanceof Date ? from : new Date(from);

  // Check if the date is valid
  if (isNaN(fromDate.getTime())) {
    debug.error('Invalid date provided to formatRelativeDate:', from);
    return 'Invalid date';
  }

  const currentDate = new Date();
  if (currentDate.getTime() - fromDate.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(fromDate, { addSuffix: true });
  } else {
    if (currentDate.getFullYear() === fromDate.getFullYear()) {
      return formatDate(fromDate, "MMM d");
    } else {
      return formatDate(fromDate, "MMM d, yyyy");
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Generates a URL-friendly slug from a string
 * @param input The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Filters out duplicate rounds by name, keeping the most recent one
 * @param rounds Array of rounds to filter
 * @returns Array of unique rounds by name
 */
export function filterUniqueRoundsByName<T extends { name: string; createdAt: Date | string }>(rounds: T[]): T[] {
  const uniqueRoundsByName = new Map<string, T>();

  rounds.forEach(round => {
    const roundCreatedAt = round.createdAt instanceof Date ? round.createdAt : new Date(round.createdAt);

    if (!uniqueRoundsByName.has(round.name) ||
        roundCreatedAt > new Date(uniqueRoundsByName.get(round.name)!.createdAt)) {
      uniqueRoundsByName.set(round.name, round);
    }
  });

  return Array.from(uniqueRoundsByName.values());
}

// Note: Server-only timezone functions have been moved to server-utils.ts
// This file is safe to use in client components
