'use client';

import { StickerPosition } from '@prisma/client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import debug from '@/lib/debug';

// Define the sticker types
interface FeedSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  limit: number | null;
  isActive: boolean;
  usageCount: number;
}

interface DefaultFeedSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  isActive: boolean;
}

// Storage key for usage counts
const COMPETITION_STICKER_USAGE_STORAGE_KEY = 'competition-feed-sticker-usage';

// Define the context type
interface CompetitionFeedStickersContextType {
  stickers: FeedSticker[];
  defaultSticker: DefaultFeedSticker | null;
  isLoading: boolean;
  error: string | null;
  getRandomSticker: () => { stickerId: string; imageUrl: string; position: StickerPosition } | null;
  incrementStickerUsage: (stickerId: string) => void;
  refreshStickers: () => Promise<void>;
  resetUsageCounts: () => void;
}

// Create the context with default values
const CompetitionFeedStickersContext = createContext<CompetitionFeedStickersContextType>({
  stickers: [],
  defaultSticker: null,
  isLoading: true,
  error: null,
  getRandomSticker: () => null,
  incrementStickerUsage: () => {},
  refreshStickers: async () => {},
  resetUsageCounts: () => {},
});

// Provider component
export function CompetitionFeedStickersProvider({
  children,
  competitionId
}: {
  children: ReactNode;
  competitionId: string;
}) {
  const [stickers, setStickers] = useState<FeedSticker[]>([]);
  const [defaultSticker, setDefaultSticker] = useState<DefaultFeedSticker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stickers from the API
  const fetchStickers = async () => {
    if (!competitionId) {
      debug.log('HOOK: useCompetitionFeedStickers - No competitionId provided, skipping fetch');
      setIsLoading(false);
      return;
    }

    try {
      debug.log(`HOOK: useCompetitionFeedStickers - Fetching stickers for competition ${competitionId}`);
      setIsLoading(true);
      setError(null);

      // Fetch all feed stickers (including default) from the public endpoint
      const response = await fetch(`/api/public/competitions/${competitionId}/feed-stickers`);

      if (!response.ok) {
        debug.error('HOOK: useCompetitionFeedStickers - API response not OK', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Failed to fetch competition feed stickers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      debug.log('HOOK: useCompetitionFeedStickers - Fetched stickers', {
        stickersCount: data.stickers.length,
        hasDefaultSticker: !!data.defaultSticker,
        stickers: data.stickers.map((s: any) => ({
          id: s.id,
          title: s.title,
          position: s.position,
          imageUrl: s.imageUrl ? (s.imageUrl.substring(0, 30) + '...') : 'none'
        })),
        defaultSticker: data.defaultSticker ? {
          id: data.defaultSticker.id,
          title: data.defaultSticker.title,
          position: data.defaultSticker.position,
          imageUrl: data.defaultSticker.imageUrl ? (data.defaultSticker.imageUrl.substring(0, 30) + '...') : 'none'
        } : null
      });

      // Try to load usage counts from localStorage
      let savedUsageCounts: Record<string, number> = {};
      try {
        if (typeof window !== 'undefined') {
          const savedData = localStorage.getItem(`${COMPETITION_STICKER_USAGE_STORAGE_KEY}-${competitionId}`);
          if (savedData) {
            savedUsageCounts = JSON.parse(savedData);
            debug.log('HOOK: useCompetitionFeedStickers - Loaded usage counts from localStorage', savedUsageCounts);
          }
        }
      } catch (err) {
        debug.error('HOOK: useCompetitionFeedStickers - Error loading usage counts from localStorage:', err);
        // Continue with empty usage counts if there's an error
      }

      // Initialize usage count for each sticker, using saved counts if available
      const stickersWithUsage = data.stickers.map((sticker: any) => ({
        ...sticker,
        usageCount: savedUsageCounts[sticker.id] || 0,
      }));

      setStickers(stickersWithUsage);
      debug.log('HOOK: useCompetitionFeedStickers - Set stickers array with', stickersWithUsage.length, 'items');

      // Set default sticker if available
      if (data.defaultSticker) {
        setDefaultSticker(data.defaultSticker);
        debug.log('HOOK: useCompetitionFeedStickers - Set default sticker', {
          id: data.defaultSticker.id,
          title: data.defaultSticker.title
        });
      } else {
        debug.log('HOOK: useCompetitionFeedStickers - No default sticker available');
      }
    } catch (err) {
      debug.error('HOOK: useCompetitionFeedStickers - Error fetching feed stickers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      debug.log('HOOK: useCompetitionFeedStickers - Finished loading stickers, isLoading set to false');
    }
  };

  // Fetch stickers on component mount and when competitionId changes
  useEffect(() => {
    fetchStickers();
  }, [competitionId]);

  // Get a random sticker that hasn't reached its limit
  const getRandomSticker = () => {
    debug.log('HOOK: useCompetitionFeedStickers - Getting random sticker', {
      totalStickers: stickers.length,
      hasDefaultSticker: !!defaultSticker,
      isLoading,
      competitionId,
      allStickers: stickers.map(s => ({
        id: s.id,
        title: s.title,
        position: s.position,
        isActive: s.isActive,
        limit: s.limit,
        usageCount: s.usageCount,
        imageUrl: s.imageUrl ? (s.imageUrl.substring(0, 30) + '...') : 'none'
      }))
    });

    // Filter out inactive stickers, stickers that have reached their limit, and stickers without valid URLs
    const availableStickers = stickers.filter(
      (sticker) =>
        sticker.isActive &&
        (sticker.limit === null || sticker.usageCount < sticker.limit) &&
        sticker.imageUrl && // Make sure imageUrl exists
        (sticker.imageUrl.startsWith('http') || sticker.imageUrl.startsWith('/')) // Make sure it's a valid URL
    );

    debug.log('HOOK: useCompetitionFeedStickers - Available stickers:', {
      count: availableStickers.length,
      stickers: availableStickers.map(s => ({ id: s.id, title: s.title, limit: s.limit, usageCount: s.usageCount }))
    });

    // If no stickers are available, use the default sticker if it exists
    if (availableStickers.length === 0) {
      if (defaultSticker && defaultSticker.isActive && defaultSticker.imageUrl) {
        debug.log('HOOK: useCompetitionFeedStickers - Using default sticker', {
          id: defaultSticker.id,
          title: defaultSticker.title
        });
        return {
          stickerId: defaultSticker.id,
          imageUrl: defaultSticker.imageUrl,
          position: defaultSticker.position,
        };
      }
      debug.log('HOOK: useCompetitionFeedStickers - No stickers available and no default sticker');
      return null;
    }

    // Get a random sticker from the available ones
    const randomIndex = Math.floor(Math.random() * availableStickers.length);
    const selectedSticker = availableStickers[randomIndex];

    debug.log('HOOK: useCompetitionFeedStickers - Selected random sticker', {
      id: selectedSticker.id,
      title: selectedSticker.title,
      position: selectedSticker.position
    });

    return {
      stickerId: selectedSticker.id,
      imageUrl: selectedSticker.imageUrl,
      position: selectedSticker.position,
    };
  };

  // Increment the usage count for a sticker
  const incrementStickerUsage = (stickerId: string) => {
    debug.log('HOOK: useCompetitionFeedStickers - Incrementing usage count for sticker', { stickerId });

    setStickers((prevStickers) => {
      const updatedStickers = prevStickers.map((sticker) => {
        if (sticker.id === stickerId) {
          // Only increment if there's no limit or we haven't reached it yet
          const shouldIncrement = sticker.limit === null || sticker.usageCount < sticker.limit;

          if (shouldIncrement) {
            debug.log('HOOK: useCompetitionFeedStickers - Incrementing count', {
              stickerId,
              oldCount: sticker.usageCount,
              newCount: sticker.usageCount + 1,
              limit: sticker.limit
            });
            return { ...sticker, usageCount: sticker.usageCount + 1 };
          } else {
            debug.log('HOOK: useCompetitionFeedStickers - Reached limit, not incrementing', {
              stickerId,
              count: sticker.usageCount,
              limit: sticker.limit
            });
            return sticker;
          }
        }
        return sticker;
      });

      // Save updated usage counts to localStorage
      try {
        if (typeof window !== 'undefined') {
          const usageCounts = updatedStickers.reduce((acc, sticker) => {
            acc[sticker.id] = sticker.usageCount;
            return acc;
          }, {} as Record<string, number>);

          localStorage.setItem(`${COMPETITION_STICKER_USAGE_STORAGE_KEY}-${competitionId}`, JSON.stringify(usageCounts));
          debug.log('HOOK: useCompetitionFeedStickers - Saved usage counts to localStorage');
        }
      } catch (err) {
        debug.error('HOOK: useCompetitionFeedStickers - Error saving usage counts to localStorage:', err);
        // Continue even if saving to localStorage fails
      }

      return updatedStickers;
    });
  };

  // Reset all usage counts
  const resetUsageCounts = () => {
    debug.log('HOOK: useCompetitionFeedStickers - Resetting all usage counts');

    setStickers((prevStickers) => {
      const resetStickers = prevStickers.map((sticker) => ({
        ...sticker,
        usageCount: 0,
      }));

      // Clear usage counts in localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${COMPETITION_STICKER_USAGE_STORAGE_KEY}-${competitionId}`);
          debug.log('HOOK: useCompetitionFeedStickers - Cleared usage counts from localStorage');
        }
      } catch (err) {
        debug.error('HOOK: useCompetitionFeedStickers - Error clearing usage counts from localStorage:', err);
      }

      return resetStickers;
    });
  };

  // Provide the context value
  const contextValue = {
    stickers,
    defaultSticker,
    isLoading,
    error,
    getRandomSticker,
    incrementStickerUsage,
    refreshStickers: fetchStickers,
    resetUsageCounts,
  };

  return (
    <CompetitionFeedStickersContext.Provider value={contextValue}>
      {children}
    </CompetitionFeedStickersContext.Provider>
  );
}

// Hook to use the feed stickers context
export function useCompetitionFeedStickers() {
  return useContext(CompetitionFeedStickersContext);
}
