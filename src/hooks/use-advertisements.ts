"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { MediaType } from "@prisma/client";
import { useFeatureSettings } from "./use-feature-settings";
import { useEffect, useState } from "react";

import debug from "@/lib/debug";

export type AdvertisementData = {
  id: string;
  title: string;
  adType: MediaType;
  skipDuration: number;
  displayFrequency: number;
  url?: string;
  media: {
    url: string;
    type: MediaType;
  };
};

export function useAdvertisements() {
  const { advertisementsEnabled } = useFeatureSettings();
  const [isClientReady, setIsClientReady] = useState(false);

  // Always call useQueryClient - it should be available in the QueryClient provider
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set client ready after a short delay to ensure QueryClient is available
    const timer = setTimeout(() => {
      setIsClientReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  debug.log("Advertisement feature enabled:", advertisementsEnabled);

  const { data, isLoading, error, refetch } = useQuery<{ advertisements: AdvertisementData[] }>({
    queryKey: ["advertisements"],
    queryFn: async () => {
      if (!advertisementsEnabled) {
        return { advertisements: [] };
      }

      try {
        const response = await apiClient.get<{ advertisements: AdvertisementData[] }>(
          "/api/advertisements"
        );
        debug.log("Raw advertisement API response:", response);
        return response.data;
      } catch (error) {
        debug.error("Error fetching advertisements:", error);
        // Return empty array instead of throwing to prevent breaking the UI
        return { advertisements: [] };
      }
    },
    // Refresh advertisements every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Don't refetch on window focus to avoid disrupting user experience
    refetchOnWindowFocus: false,
    // Only enable the query when the client is ready and QueryClient is available
    enabled: isClientReady && !!queryClient,
  });

  // Log the result for debugging
  debug.log("Advertisement data:", {
    count: data?.advertisements?.length || 0,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
  });

  return {
    advertisements: data?.advertisements || [],
    isLoading,
    error,
    refetch,
  };
}
