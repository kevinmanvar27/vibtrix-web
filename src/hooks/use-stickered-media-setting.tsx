"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import debug from "@/lib/debug";

// Define the context type
interface StickeredMediaContextType {
  showStickeredMedia: boolean;
  setShowStickeredMedia: (value: boolean) => void;
  isLoading: boolean;
}

// Create the context with default values
const StickeredMediaContext = createContext<StickeredMediaContextType>({
  showStickeredMedia: true,
  setShowStickeredMedia: () => {},
  isLoading: true,
});

// Provider component
export function StickeredMediaProvider({
  children,
  initialValue = true,
  onValueChange
}: {
  children: ReactNode;
  initialValue?: boolean;
  onValueChange?: (value: boolean) => void;
}) {
  const [showStickeredMedia, setShowStickeredMedia] = useState<boolean>(initialValue);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Fetch the initial setting from the server
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const response = await apiClient.get<{ showStickeredAdvertisements: boolean }>("/api/settings/stickered-media");
        setShowStickeredMedia(response.data.showStickeredAdvertisements);
        setIsLoading(false);
      } catch (error) {
        debug.error("Error fetching stickered media setting:", error);
        // Use the initial value if there's an error
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, []);

  // Create a function to update the setting
  const updateShowStickeredMedia = (value: boolean) => {
    setShowStickeredMedia(value);

    // Call the onValueChange callback if provided
    if (onValueChange) {
      debug.log(`HOOK: useStickeredMediaSetting - Calling onValueChange callback with value: ${value}`);
      onValueChange(value);
    }

    // Invalidate the relevant queries to trigger a refetch
    // Use exact: false to invalidate all queries that start with the given key
    // Use refetchType: 'all' to ensure all pages in infinite queries are refetched
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

    debug.log(`Stickered media setting updated to: ${value}`);
  };

  return (
    <StickeredMediaContext.Provider
      value={{
        showStickeredMedia,
        setShowStickeredMedia: updateShowStickeredMedia,
        isLoading,
      }}
    >
      {children}
    </StickeredMediaContext.Provider>
  );
}

// Hook to use the stickered media setting
export function useStickeredMediaSetting() {
  return useContext(StickeredMediaContext);
}
