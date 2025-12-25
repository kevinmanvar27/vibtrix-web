import debug from "@/lib/debug";

/**
 * Extracts post IDs from message content containing post links
 * @param content Message content to parse
 * @param baseUrl Base URL of the application (optional, defaults to current origin)
 * @returns Array of post IDs found in the message
 */
export function extractPostIdsFromMessage(content: string, baseUrl?: string): string[] {
  // If no content, return empty array
  if (!content) return [];

  try {
    // Get the base URL (either provided or from window.location)
    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

    if (!origin) return [];

    // Create a regex to match post links
    // This will match links like: http://localhost:3001/posts/123456
    const postLinkRegex = new RegExp(`${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/posts/([a-zA-Z0-9-_]+)`, 'g');

    // Find all matches
    const matches = [...content.matchAll(postLinkRegex)];

    // Extract post IDs from matches and filter out any empty IDs
    return matches.map(match => match[1]).filter(id => !!id);
  } catch (error) {
    debug.error('Error extracting post IDs from message:', error);
    return [];
  }
}

/**
 * Checks if a message contains a post link
 * @param content Message content to check
 * @param baseUrl Base URL of the application (optional, defaults to current origin)
 * @returns Boolean indicating if the message contains a post link
 */
export function messageContainsPostLink(content: string, baseUrl?: string): boolean {
  try {
    return extractPostIdsFromMessage(content, baseUrl).length > 0;
  } catch (error) {
    debug.error('Error checking if message contains post link:', error);
    return false;
  }
}

/**
 * Gets the first post ID from a message containing post links
 * @param content Message content to parse
 * @param baseUrl Base URL of the application (optional, defaults to current origin)
 * @returns First post ID found in the message, or null if none found
 */
export function getFirstPostIdFromMessage(content: string, baseUrl?: string): string | null {
  try {
    const postIds = extractPostIdsFromMessage(content, baseUrl);
    return postIds.length > 0 ? postIds[0] : null;
  } catch (error) {
    debug.error('Error getting first post ID from message:', error);
    return null;
  }
}
