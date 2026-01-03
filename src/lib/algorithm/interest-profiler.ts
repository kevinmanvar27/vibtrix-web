/**
 * User Interest Profiler
 * Builds and updates user interest profiles based on behavior
 */

import prisma from '@/lib/prisma';
import { InterestVector, CONTENT_CATEGORIES, ContentCategory } from './types';
import debug from '@/lib/debug';

// Learning rate for interest updates
const LEARNING_RATE = 0.1;
const DECAY_RATE = 0.95; // Interests decay 5% per day without reinforcement

/**
 * Update user interest profile based on a watch event
 */
export async function updateUserInterests(
  userId: string,
  postId: string,
  completionRate: number,
  replayed: boolean = false
): Promise<void> {
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
}

/**
 * Get user interest profile
 */
export async function getUserInterests(userId: string): Promise<InterestVector> {
  const profile = await prisma.userInterestProfile.findUnique({
    where: { userId },
  });

  if (profile) {
    return profile.interests as InterestVector;
  }

  // Return default neutral interests
  const defaultInterests: InterestVector = {};
  CONTENT_CATEGORIES.forEach(cat => {
    defaultInterests[cat] = 0.5;
  });
  return defaultInterests;
}

/**
 * Calculate similarity between user interests and post content
 */
export function calculateInterestMatch(
  userInterests: InterestVector,
  postTags: Record<string, number>
): number {
  let dotProduct = 0;
  let userMagnitude = 0;
  let postMagnitude = 0;

  // Calculate dot product and magnitudes
  for (const category of CONTENT_CATEGORIES) {
    const userScore = userInterests[category] || 0;
    const postScore = postTags[category] || 0;

    dotProduct += userScore * postScore;
    userMagnitude += userScore * userScore;
    postMagnitude += postScore * postScore;
  }

  // Cosine similarity
  const magnitude = Math.sqrt(userMagnitude) * Math.sqrt(postMagnitude);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Apply daily decay to user interests
 * Should be run as a cron job
 */
export async function applyInterestDecay(): Promise<void> {
  try {
    const profiles = await prisma.userInterestProfile.findMany();

    for (const profile of profiles) {
      const interests = profile.interests as InterestVector;
      
      // Apply decay - move interests toward neutral (0.5)
      for (const category of Object.keys(interests)) {
        const current = interests[category];
        const neutral = 0.5;
        interests[category] = current + (neutral - current) * (1 - DECAY_RATE);
      }

      await prisma.userInterestProfile.update({
        where: { id: profile.id },
        data: { interests },
      });
    }

    debug.log(`[InterestProfiler] Applied decay to ${profiles.length} profiles`);
  } catch (error) {
    debug.error('[InterestProfiler] Failed to apply interest decay:', error);
  }
}

/**
 * Auto-tag a post based on its content
 * Uses hashtags, caption keywords, and media analysis
 */
export async function autoTagPost(
  postId: string,
  content: string,
  hashtags: string[] = []
): Promise<void> {
  try {
    const tags: Record<string, number> = {};

    // Initialize all categories with 0
    CONTENT_CATEGORIES.forEach(cat => {
      tags[cat] = 0;
    });

    // Extract hashtags from content if not provided
    const extractedHashtags = content.match(/#\w+/g) || [];
    const allHashtags = [...new Set([...hashtags, ...extractedHashtags.map(h => h.toLowerCase())])];

    // Map hashtags to categories
    const hashtagCategoryMap: Record<string, ContentCategory[]> = {
      '#dance': ['dance', 'entertainment'],
      '#dancing': ['dance', 'entertainment'],
      '#music': ['music', 'entertainment'],
      '#song': ['music'],
      '#funny': ['comedy', 'entertainment'],
      '#comedy': ['comedy', 'entertainment'],
      '#lol': ['comedy'],
      '#fashion': ['fashion', 'lifestyle'],
      '#style': ['fashion', 'lifestyle'],
      '#ootd': ['fashion'],
      '#beauty': ['beauty', 'lifestyle'],
      '#makeup': ['beauty'],
      '#skincare': ['beauty'],
      '#fitness': ['fitness', 'lifestyle'],
      '#gym': ['fitness'],
      '#workout': ['fitness'],
      '#food': ['food', 'lifestyle'],
      '#cooking': ['food'],
      '#recipe': ['food'],
      '#travel': ['travel', 'lifestyle'],
      '#vacation': ['travel'],
      '#tech': ['tech'],
      '#technology': ['tech'],
      '#gaming': ['gaming', 'entertainment'],
      '#game': ['gaming'],
      '#education': ['education'],
      '#learn': ['education'],
      '#news': ['news'],
      '#sports': ['sports'],
      '#art': ['art'],
      '#artist': ['art'],
      '#pets': ['pets'],
      '#dog': ['pets'],
      '#cat': ['pets'],
      '#motivation': ['motivation', 'lifestyle'],
      '#business': ['business'],
      '#entrepreneur': ['business'],
    };

    // Score based on hashtags
    for (const hashtag of allHashtags) {
      const categories = hashtagCategoryMap[hashtag];
      if (categories) {
        for (const cat of categories) {
          tags[cat] = Math.min(1, (tags[cat] || 0) + 0.3);
        }
      }
    }

    // Keyword analysis in content
    const contentLower = content.toLowerCase();
    const keywordCategoryMap: Record<string, ContentCategory[]> = {
      'dance': ['dance'],
      'music': ['music'],
      'funny': ['comedy'],
      'fashion': ['fashion'],
      'beauty': ['beauty'],
      'fitness': ['fitness'],
      'food': ['food'],
      'travel': ['travel'],
      'tech': ['tech'],
      'game': ['gaming'],
      'learn': ['education'],
      'news': ['news'],
      'sport': ['sports'],
      'art': ['art'],
      'pet': ['pets'],
      'motivation': ['motivation'],
      'business': ['business'],
    };

    for (const [keyword, categories] of Object.entries(keywordCategoryMap)) {
      if (contentLower.includes(keyword)) {
        for (const cat of categories) {
          tags[cat] = Math.min(1, (tags[cat] || 0) + 0.2);
        }
      }
    }

    // If no tags detected, mark as 'other'
    const hasAnyTag = Object.values(tags).some(v => v > 0);
    if (!hasAnyTag) {
      tags['other'] = 1;
    }

    // Upsert content vector
    await prisma.postContentVector.upsert({
      where: { postId },
      create: {
        postId,
        tags,
        hashtags: allHashtags,
      },
      update: {
        tags,
        hashtags: allHashtags,
      },
    });

    debug.log(`[InterestProfiler] Auto-tagged post ${postId}:`, tags);
  } catch (error) {
    debug.error('[InterestProfiler] Failed to auto-tag post:', error);
  }
}
