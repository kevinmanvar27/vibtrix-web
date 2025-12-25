'use client';

import { StickerPosition } from '@prisma/client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import debug from '@/lib/debug';

// Local storage key for sticker usage counts
const STICKER_USAGE_STORAGE_KEY = 'feed-stickers-usage-counts';

// Define the sticker types
export interface FeedSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  limit: number | null;
  isActive: boolean;
  usageCount: number;
}

export interface DefaultFeedSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  isActive: boolean;
}

// Define the context type
interface FeedStickersContextType {
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
const FeedStickersContext = createContext<FeedStickersContextType>({
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
export function FeedStickersProvider({ children }: { children: ReactNode }) {
  debug.log('PROVIDER: FeedStickersProvider - Component mounted');

  const [stickers, setStickers] = useState<FeedSticker[]>([]);
  const [defaultSticker, setDefaultSticker] = useState<DefaultFeedSticker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stickers from the API
  const fetchStickers = async () => {
    try {
      debug.log('HOOK: useFeedStickers - Fetching stickers from API');
      setIsLoading(true);
      setError(null);

      // Fetch all feed stickers (including default) from the public endpoint
      debug.log('HOOK: useFeedStickers - Calling /api/public/feed-stickers');
      const response = await fetch('/api/public/feed-stickers');

      if (!response.ok) {
        debug.error('HOOK: useFeedStickers - API response not OK', {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Failed to fetch feed stickers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      debug.log('HOOK: useFeedStickers - Fetched stickers', {
        stickersCount: data.stickers.length,
        hasDefaultSticker: !!data.defaultSticker,
        stickers: data.stickers.map((s: any) => ({ id: s.id, title: s.title })),
        defaultSticker: data.defaultSticker ? { id: data.defaultSticker.id, title: data.defaultSticker.title } : null
      });

      // Try to load usage counts from localStorage
      let savedUsageCounts: Record<string, number> = {};
      try {
        if (typeof window !== 'undefined') {
          const savedData = localStorage.getItem(STICKER_USAGE_STORAGE_KEY);
          if (savedData) {
            savedUsageCounts = JSON.parse(savedData);
            debug.log('HOOK: useFeedStickers - Loaded usage counts from localStorage', savedUsageCounts);
          }
        }
      } catch (err) {
        debug.error('HOOK: useFeedStickers - Error loading usage counts from localStorage:', err);
        // Continue with empty usage counts if there's an error
      }

      // Initialize usage count for each sticker, using saved counts if available
      const stickersWithUsage = data.stickers.map((sticker: any) => ({
        ...sticker,
        usageCount: savedUsageCounts[sticker.id] || 0,
      }));

      setStickers(stickersWithUsage);
      debug.log('HOOK: useFeedStickers - Set stickers array with', stickersWithUsage.length, 'items');

      // Set default sticker if available
      if (data.defaultSticker) {
        setDefaultSticker(data.defaultSticker);
        debug.log('HOOK: useFeedStickers - Set default sticker', {
          id: data.defaultSticker.id,
          title: data.defaultSticker.title,
          imageUrl: data.defaultSticker.imageUrl,
          position: data.defaultSticker.position
        });
      } else {
        debug.log('HOOK: useFeedStickers - No default sticker available');
      }
    } catch (err) {
      debug.error('HOOK: useFeedStickers - Error fetching feed stickers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      debug.log('HOOK: useFeedStickers - Finished loading stickers, isLoading set to false');
    }
  };

  // Fetch stickers on component mount
  useEffect(() => {
    fetchStickers();
  }, []);

  // Get a random sticker that hasn't reached its limit
  const getRandomSticker = () => {
    debug.log('HOOK: getRandomSticker - Getting random sticker', {
      totalStickers: stickers.length,
      hasDefaultSticker: !!defaultSticker,
      isLoading
    });

    // Filter out inactive stickers, stickers that have reached their limit, and stickers without valid URLs
    const availableStickers = stickers.filter(
      (sticker) =>
        sticker.isActive &&
        (sticker.limit === null || sticker.usageCount < sticker.limit) &&
        sticker.imageUrl && // Make sure imageUrl exists
        (sticker.imageUrl.startsWith('http') || sticker.imageUrl.startsWith('/')) // Make sure it's a valid URL
    );

    debug.log('HOOK: getRandomSticker - Available stickers', {
      count: availableStickers.length,
      stickers: availableStickers.map(s => ({
        id: s.id,
        title: s.title,
        limit: s.limit,
        usageCount: s.usageCount,
        imageUrl: s.imageUrl ? s.imageUrl.substring(0, 30) + '...' : 'none'
      }))
    });

    if (availableStickers.length === 0) {
      // If no stickers are available or all have reached their limits, use the default sticker
      if (defaultSticker && defaultSticker.isActive && defaultSticker.imageUrl &&
          (defaultSticker.imageUrl.startsWith('http') || defaultSticker.imageUrl.startsWith('/'))) {
        debug.log('HOOK: getRandomSticker - Using default sticker', {
          id: defaultSticker.id,
          title: defaultSticker.title,
          imageUrl: defaultSticker.imageUrl ? defaultSticker.imageUrl.substring(0, 30) + '...' : 'none',
          position: defaultSticker.position
        });
        return {
          stickerId: defaultSticker.id,
          imageUrl: defaultSticker.imageUrl,
          position: defaultSticker.position,
        };
      }
      debug.log('HOOK: getRandomSticker - No stickers available and no default sticker');
      return null;
    }

    // Get a random sticker from the available ones
    const randomIndex = Math.floor(Math.random() * availableStickers.length);
    const selectedSticker = availableStickers[randomIndex];

    debug.log('HOOK: getRandomSticker - Selected random sticker', {
      id: selectedSticker.id,
      title: selectedSticker.title,
      position: selectedSticker.position,
      imageUrl: selectedSticker.imageUrl ? selectedSticker.imageUrl.substring(0, 30) + '...' : 'none'
    });

    return {
      stickerId: selectedSticker.id,
      imageUrl: selectedSticker.imageUrl,
      position: selectedSticker.position,
    };
  };

  // Increment the usage count for a sticker
  const incrementStickerUsage = (stickerId: string) => {
    debug.log('HOOK: incrementStickerUsage - Incrementing usage count for sticker', { stickerId });

    setStickers((prevStickers) => {
      const updatedStickers = prevStickers.map((sticker) => {
        if (sticker.id === stickerId) {
          // Only increment if there's no limit or we haven't reached it yet
          const shouldIncrement = sticker.limit === null || sticker.usageCount < sticker.limit;

          if (shouldIncrement) {
            debug.log('HOOK: incrementStickerUsage - Incrementing count', {
              stickerId,
              oldCount: sticker.usageCount,
              newCount: sticker.usageCount + 1,
              limit: sticker.limit
            });
            return { ...sticker, usageCount: sticker.usageCount + 1 };
          } else {
            debug.log('HOOK: incrementStickerUsage - Reached limit, not incrementing', {
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
          // Create a map of sticker IDs to usage counts
          const usageCounts = updatedStickers.reduce((acc, sticker) => {
            acc[sticker.id] = sticker.usageCount;
            return acc;
          }, {} as Record<string, number>);

          localStorage.setItem(STICKER_USAGE_STORAGE_KEY, JSON.stringify(usageCounts));
          debug.log('HOOK: incrementStickerUsage - Saved usage counts to localStorage', usageCounts);
        }
      } catch (err) {
        debug.error('HOOK: incrementStickerUsage - Error saving usage counts to localStorage:', err);
        // Continue even if saving to localStorage fails
      }

      return updatedStickers;
    });
  };

  // Refresh stickers from the API
  const refreshStickers = async () => {
    await fetchStickers();
  };

  // Reset all sticker usage counts
  const resetUsageCounts = () => {
    debug.log('HOOK: resetUsageCounts - Resetting all sticker usage counts');

    // Reset counts in state
    setStickers((prevStickers) =>
      prevStickers.map(sticker => ({
        ...sticker,
        usageCount: 0
      }))
    );

    // Clear localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STICKER_USAGE_STORAGE_KEY);
        debug.log('HOOK: resetUsageCounts - Cleared usage counts from localStorage');
      }
    } catch (err) {
      debug.error('HOOK: resetUsageCounts - Error clearing usage counts from localStorage:', err);
    }
  };

  return (
    <FeedStickersContext.Provider
      value={{
        stickers,
        defaultSticker,
        isLoading,
        error,
        getRandomSticker,
        incrementStickerUsage,
        refreshStickers,
        resetUsageCounts,
      }}
    >
      {children}
    </FeedStickersContext.Provider>
  );
}

// Hook to use feed stickers
export function useFeedStickers() {
  return useContext(FeedStickersContext);
}
