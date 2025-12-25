"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import debug from "@/lib/debug";

// Define the context type
interface FeedStickersSettingContextType {
  showFeedStickers: boolean;
  setShowFeedStickers: (value: boolean) => void;
  isLoading: boolean;
}

// Create the context with default values
const FeedStickersSettingContext = createContext<FeedStickersSettingContextType>({
  showFeedStickers: true,
  setShowFeedStickers: () => {},
  isLoading: true,
});

// Provider component
export function FeedStickersSettingProvider({
  children,
  initialValue = true,
  onValueChange
}: {
  children: ReactNode;
  initialValue?: boolean;
  onValueChange?: (value: boolean) => void;
}) {
  debug.log('PROVIDER: FeedStickersSettingProvider - Component mounted', { initialValue });

  const [showFeedStickers, setShowFeedStickers] = useState<boolean>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Fetch the initial setting from the server
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        debug.log('HOOK: useFeedStickersSetting - Fetching setting from API');
        const response = await apiClient.get<{ showFeedStickers: boolean }>("/api/settings/feed-stickers");

        // Check if the response contains a valid boolean value
        const receivedValue = response.data.showFeedStickers;
        debug.log('HOOK: useFeedStickersSetting - Received setting', {
          showFeedStickers: receivedValue,
          type: typeof receivedValue
        });

        // If the value is undefined or not a boolean, use the initial value
        if (typeof receivedValue !== 'boolean') {
          debug.log('HOOK: useFeedStickersSetting - Received non-boolean value, using default', { initialValue });
          setShowFeedStickers(initialValue);
        } else {
          setShowFeedStickers(receivedValue);
        }

        setIsLoading(false);
      } catch (error) {
        debug.error("HOOK: useFeedStickersSetting - Error fetching feed stickers setting:", error);
        // Use the initial value if there's an error
        debug.log('HOOK: useFeedStickersSetting - Using default value due to error', { initialValue });
        setShowFeedStickers(initialValue);
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, [initialValue]);

  // Create a function to update the setting
  const updateShowFeedStickers = (value: boolean) => {
    debug.log(`HOOK: useFeedStickersSetting - Updating setting to: ${value}`);

    // Update the state immediately
    setShowFeedStickers(value);

    // Call the onValueChange callback if provided
    if (onValueChange) {
      debug.log(`HOOK: useFeedStickersSetting - Calling onValueChange callback with value: ${value}`);
      onValueChange(value);
    }

    // Log the current state after update
    debug.log(`HOOK: useFeedStickersSetting - State updated, current value: ${value}`);

    // Invalidate the relevant queries to trigger a refetch
    debug.log('HOOK: useFeedStickersSetting - Invalidating queries to trigger refetch');
    queryClient.invalidateQueries({
      queryKey: ["post-feed", "for-you"],
      exact: false,
      refetchType: 'all'
    });
    queryClient.invalidateQueries({
      queryKey: ["post-feed", "following"],
      exact: false,
      refetchType: 'all'
    });

    // Force a refresh of the current page data
    setTimeout(() => {
      debug.log('HOOK: useFeedStickersSetting - Forcing refresh of current page data');
      window.dispatchEvent(new CustomEvent('feed-stickers-setting-changed', { detail: { showFeedStickers: value } }));
    }, 100);

    debug.log(`HOOK: useFeedStickersSetting - Feed stickers setting updated to: ${value}`);
  };

  return (
    <FeedStickersSettingContext.Provider
      value={{
        showFeedStickers,
        setShowFeedStickers: updateShowFeedStickers,
        isLoading,
      }}
    >
      {children}
    </FeedStickersSettingContext.Provider>
  );
}

// Hook to use the feed stickers setting
export function useFeedStickersSetting() {
  return useContext(FeedStickersSettingContext);
}
