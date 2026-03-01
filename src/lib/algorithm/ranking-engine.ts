/**
 * Feed Ranking Engine
 * Generates personalized feeds using Instagram-like algorithm
 * 
 * NOTE: This module requires additional Prisma models that are not yet implemented:
 * - postMetrics
 * - userInterestProfile
 * Functions are stubbed to prevent build errors.
 */

import prisma from '@/lib/prisma';
import { 
  PostScore, 
  FeedConfig, 
  DEFAULT_FEED_CONFIG,
  InterestVector 
} from './types';
import { getUserInterests, calculateInterestMatch } from './interest-profiler';
import debug from '@/lib/debug';

const CACHE_DURATION_MINUTES = 10;

interface RankedPost {
  id: string;
  userId: string;
  createdAt: Date;
  score: number;
  reasons: string[];
}

/**
 * Generate personalized feed for a user
 * STUB: Returns empty feed - requires postMetrics model
 */
export async function generatePersonalizedFeed(
  userId: string | null,
  options: {
    limit?: number;
    cursor?: string;
    excludePostIds?: string[];
    feedType?: 'for_you' | 'following' | 'explore';
  } = {}
): Promise<{ posts: RankedPost[]; nextCursor: string | null }> {
  debug.log(`[RankingEngine] generatePersonalizedFeed called (stubbed) - user: ${userId}, type: ${options.feedType}`);
  return { posts: [], nextCursor: null }; // STUB: Always return empty
}

/**
 * Hide a creator's content from user's feed
 * STUB: Returns early - requires userHiddenCreators model
 */
export async function hideCreator(userId: string, creatorId: string): Promise<void> {
  debug.log(`[RankingEngine] hideCreator called (stubbed) - user: ${userId}, creator: ${creatorId}`);
  return; // STUB: Model not implemented
}

/**
 * Mark a post as "not interested"
 * STUB: Returns early - requires userNotInterestedPosts model
 */
export async function markNotInterested(userId: string, postId: string): Promise<void> {
  debug.log(`[RankingEngine] markNotInterested called (stubbed) - user: ${userId}, post: ${postId}`);
  return; // STUB: Model not implemented
}

/**
 * Get cached feed
 * STUB: Always returns null
 */
async function getCachedFeed(userId: string, feedType: string): Promise<RankedPost[] | null> {
  return null; // STUB: No caching
}

/**
 * Cache feed
 * STUB: Does nothing
 */
async function cacheFeed(userId: string, feedType: string, posts: RankedPost[]): Promise<void> {
  return; // STUB: No caching
}
