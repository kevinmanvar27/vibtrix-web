import { format } from "date-fns";
import { slugify } from "./utils";
import prisma from "./prisma";

/**
 * Generates a competition slug in the format: competition-name-startdate-enddate
 * @param title The competition title
 * @param startDate The start date of the first round
 * @param endDate The end date of the last round
 * @param uniqueId Optional unique identifier to ensure uniqueness
 * @returns A URL-friendly slug for the competition
 */
export function generateCompetitionSlug(
  title: string,
  startDate: Date,
  endDate: Date,
  uniqueId?: string
): string {
  const titleSlug = slugify(title);
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // Add unique identifier if provided, otherwise add timestamp for uniqueness
  const uniquePart = uniqueId || Date.now().toString();

  return `${titleSlug}-${startDateStr}-${endDateStr}-${uniquePart}`;
}

/**
 * Generates a unique competition slug by checking against existing slugs
 * @param title The competition title
 * @param startDate The start date of the first round
 * @param endDate The end date of the last round
 * @param excludeId Optional competition ID to exclude from uniqueness check (for updates)
 * @returns A unique URL-friendly slug for the competition
 */
export async function generateUniqueCompetitionSlug(
  title: string,
  startDate: Date,
  endDate: Date,
  excludeId?: string
): Promise<string> {
  const titleSlug = slugify(title);
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');

  // Base slug without unique identifier
  const baseSlug = `${titleSlug}-${startDateStr}-${endDateStr}`;

  // Check if base slug is unique
  const existingCompetition = await prisma.competition.findFirst({
    where: {
      slug: baseSlug,
      ...(excludeId && { id: { not: excludeId } })
    }
  });

  if (!existingCompetition) {
    return baseSlug;
  }

  // If base slug exists, add a unique identifier
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (true) {
    const existingWithCounter = await prisma.competition.findFirst({
      where: {
        slug: uniqueSlug,
        ...(excludeId && { id: { not: excludeId } })
      }
    });

    if (!existingWithCounter) {
      return uniqueSlug;
    }

    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
}

/**
 * Gets the URL for a competition, preferring the slug if available
 * @param competition The competition object with id and optional slug
 * @returns The URL path for the competition
 */
export function getCompetitionUrl(
  competition: { id: string; slug?: string | null }
): string {
  return competition.slug
    ? `/competitions/${competition.slug}`
    : `/competitions/${competition.id}`;
}
