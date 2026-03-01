/**
 * User Interest Profiler
 * Builds and updates user interest profiles based on behavior
 * 
 * NOTE: This module requires additional Prisma models that are not yet implemented:
 * - postContentVector
 * - userInterestProfile
 * Functions are stubbed to prevent build errors.
 */

import prisma from '@/lib/prisma';
import { InterestVector, CONTENT_CATEGORIES, ContentCategory } from './types';
import debug from '@/lib/debug';

// Learning rate for interest updates
const LEARNING_RATE = 0.1;
const DECAY_RATE = 0.95; // Interests decay 5% per day without reinforcement

/**
 * Update user interest profile based on a watch event
 * STUB: Returns early - requires postContentVector and userInterestProfile models
 */
export async function updateUserInterests(
  userId: string,
  postId: string,
  completionRate: number,
  replayed: boolean = false
): Promise<void> {
  debug.log(`[InterestProfiler] updateUserInterests called (stubbed) - user: ${userId}, post: ${postId}`);
  return; // STUB: Model not implemented
  
  // Original implementation commented out - requires missing models
  /*
  try {
    // Get post content vector (tags)
    const contentVector = await prisma.postContentVector.findUnique({
      where: { postId },
    });

    if (!contentVector) {
      debug.log(`[InterestProfiler] No content vector for post ${postId}`);
      return;
    }

    const postTags = contentVector.tags as Record<string, number>;

    // Get or create user interest profile
    let profile = await prisma.userInterestProfile.findUnique({
      where: { userId },
    });

    let currentInterests: InterestVector = {};
    
    if (profile) {
      currentInterests = profile.interests as InterestVector;
    } else {
      // Initialize with neutral interests
      CONTENT_CATEGORIES.forEach(cat => {
        currentInterests[cat] = 0.5;
      });
    }

    // Calculate interest signal strength based on watch behavior
    // High completion = strong positive signal
    // Replay = very strong positive signal
    // Low completion = weak negative signal
    let signalStrength = 0;
    
    if (replayed) {
      signalStrength = 0.3; // Strong positive
    } else if (completionRate >= 0.9) {
      signalStrength = 0.2; // Positive
    } else if (completionRate >= 0.7) {
      signalStrength = 0.1; // Mild positive
    } else if (completionRate >= 0.3) {
      signalStrength = 0; // Neutral
    } else {
      signalStrength = -0.1; // Mild negative
    }

    // Update interests based on post tags
    for (const [tag, tagWeight] of Object.entries(postTags)) {
      if (currentInterests[tag] !== undefined) {
        const delta = signalStrength * tagWeight * LEARNING_RATE;
        currentInterests[tag] = Math.max(0, Math.min(1, currentInterests[tag] + delta));
      }
    }

    // Upsert the profile
    await prisma.userInterestProfile.upsert({
      where: { userId },
      create: {
        userId,
        interests: currentInterests,
      },
      update: {
        interests: currentInterests,
      },
    });

    debug.log(`[InterestProfiler] Updated interests for user ${userId}`);
  } catch (error) {
    debug.error('[InterestProfiler] Failed to update interests:', error);
  }
  */
}

/**
 * Get user interest vector
 * STUB: Returns default interests - requires userInterestProfile model
 */
export async function getUserInterests(userId: string): Promise<InterestVector> {
  debug.log(`[InterestProfiler] getUserInterests called (stubbed) - user: ${userId}`);
  return getDefaultInterests(); // STUB: Always return defaults
}

/**
 * Get default interest vector (neutral interests)
 */
export function getDefaultInterests(): InterestVector {
  const interests: InterestVector = {};
  CONTENT_CATEGORIES.forEach(category => {
    interests[category] = 0.5; // Neutral interest
  });
  return interests;
}

/**
 * Calculate interest match score between user and post
 */
export function calculateInterestMatch(
  userInterests: InterestVector,
  postTags: Record<string, number>
): number {
  let score = 0;
  let totalWeight = 0;

  for (const [tag, weight] of Object.entries(postTags)) {
    const interest = userInterests[tag as ContentCategory] || 0.5;
    score += interest * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? score / totalWeight : 0.5;
}

/**
 * Auto-tag a post with content categories
 * STUB: Returns early - requires postContentVector model
 */
export async function autoTagPost(postId: string, content: string): Promise<void> {
  debug.log(`[InterestProfiler] autoTagPost called (stubbed) - post: ${postId}`);
  return; // STUB: Model not implemented
  
  // Original implementation commented out
  /*
  try {
    const tags = extractTags(content);
    
    await prisma.postContentVector.upsert({
      where: { postId },
      create: {
        postId,
        tags,
      },
      update: {
        tags,
      },
    });
    
    debug.log(`[InterestProfiler] Auto-tagged post ${postId}`);
  } catch (error) {
    debug.error(`[InterestProfiler] Error auto-tagging post:`, error);
  }
  */
}

// Helper function to extract tags from content
function extractTags(content: string): Record<string, number> {
  const tags: Record<string, number> = {};
  const lowerContent = content.toLowerCase();
  
  // Simple keyword matching for now
  // In production, this would use NLP/ML
  const categoryKeywords: Record<ContentCategory, string[]> = {
    comedy: ['funny', 'joke', 'laugh', 'humor', 'lol', 'comedy'],
    dance: ['dance', 'dancing', 'choreography', 'moves'],
    music: ['music', 'song', 'sing', 'singing', 'beat', 'melody'],
    sports: ['sports', 'game', 'play', 'match', 'fitness', 'workout'],
    food: ['food', 'recipe', 'cooking', 'eat', 'delicious', 'taste'],
    travel: ['travel', 'trip', 'vacation', 'destination', 'explore'],
    fashion: ['fashion', 'style', 'outfit', 'clothing', 'wear'],
    beauty: ['beauty', 'makeup', 'skincare', 'hair', 'cosmetics'],
    tech: ['tech', 'technology', 'gadget', 'app', 'software', 'code'],
    education: ['learn', 'education', 'tutorial', 'teach', 'study'],
    gaming: ['game', 'gaming', 'play', 'gamer', 'stream'],
    pets: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten'],
    art: ['art', 'draw', 'paint', 'artist', 'creative', 'design'],
    lifestyle: ['lifestyle', 'life', 'daily', 'routine', 'vlog'],
    news: ['news', 'update', 'current', 'event', 'breaking'],
    motivation: ['motivation', 'inspire', 'motivational', 'success'],
    business: ['business', 'entrepreneur', 'startup', 'marketing'],
    entertainment: ['entertainment', 'celebrity', 'movie', 'show'],
    fitness: ['fitness', 'workout', 'gym', 'exercise', 'health'],
    other: [],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        score += 1;
      }
    }
    if (score > 0) {
      tags[category] = Math.min(score / keywords.length, 1);
    }
  }

  // If no tags found, mark as OTHER
  if (Object.keys(tags).length === 0) {
    tags.OTHER = 1;
  }

  return tags;
}
