/**
 * Instagram-like Algorithm Types
 * Core type definitions for the recommendation engine
 */

export interface InterestVector {
  [category: string]: number; // 0-1 score per category
}

export interface ContentTags {
  [tag: string]: number; // 0-1 relevance per tag
}

export interface WatchEventData {
  postId: string;
  userId?: string;
  watchDuration: number;
  totalDuration: number;
  completionRate: number;
  replayCount?: number;
  skippedInFirst2s?: boolean;
  pauseCount?: number;
  deviceType?: string;
  source?: 'feed' | 'explore' | 'profile' | 'share';
}

export interface PostScore {
  postId: string;
  score: number;
  reasons?: string[];
}

export interface FeedConfig {
  interestWeight: number;      // Weight for interest matching (default: 0.7)
  explorationWeight: number;   // Weight for exploration (default: 0.2)
  randomWeight: number;        // Weight for random wildcards (default: 0.1)
  freshnessDecay: number;      // How fast old content loses relevance
  followingBoost: number;      // Boost for content from followed users
  engagementBoost: number;     // Boost based on engagement metrics
}

export interface ViralScoreWeights {
  completionRate: number;  // 0.4
  replayRate: number;      // 0.3
  saveRate: number;        // 0.2
  shareRate: number;       // 0.1
}

export interface TrustScoreFactors {
  originalityScore: number;
  engagementQuality: number;
  spamSignals: number;
  reportWeight: number;
  contentQuality: number;
}

export interface DistributionConfig {
  testBatchSize: number;           // 100-300
  testPassThreshold: number;       // Completion rate threshold to pass
  scaleBatchSize: number;          // 5000-20000
  scalePassThreshold: number;      // Threshold to go viral
}

export const DEFAULT_FEED_CONFIG: FeedConfig = {
  interestWeight: 0.7,
  explorationWeight: 0.2,
  randomWeight: 0.1,
  freshnessDecay: 0.95,      // 5% decay per day
  followingBoost: 1.5,       // 50% boost for followed users
  engagementBoost: 1.2,      // 20% boost for high engagement
};

export const DEFAULT_VIRAL_WEIGHTS: ViralScoreWeights = {
  completionRate: 0.4,
  replayRate: 0.3,
  saveRate: 0.2,
  shareRate: 0.1,
};

export const DEFAULT_DISTRIBUTION_CONFIG: DistributionConfig = {
  testBatchSize: 200,
  testPassThreshold: 0.6,    // 60% completion rate
  scaleBatchSize: 10000,
  scalePassThreshold: 0.7,   // 70% completion rate
};

// Content categories for interest profiling
export const CONTENT_CATEGORIES = [
  'dance',
  'music',
  'comedy',
  'fashion',
  'beauty',
  'fitness',
  'food',
  'travel',
  'tech',
  'gaming',
  'education',
  'news',
  'sports',
  'art',
  'pets',
  'lifestyle',
  'motivation',
  'business',
  'entertainment',
  'other'
] as const;

export type ContentCategory = typeof CONTENT_CATEGORIES[number];
