"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import Advertisement from "@/components/advertisements/Advertisement";
import apiClient from "@/lib/api-client";
import { PostsPage } from "@/lib/types";
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCompetitionAdvertisements } from "@/hooks/use-competition-advertisements";

import { startMeasure } from "@/lib/performance-monitor";

import debug from "@/lib/debug";

interface CompetitionFeedProps {
  competitionId: string;
}

// Create a new query client for this component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

// Create a wrapper component that provides the QueryClient
export default function CompetitionFeed({ competitionId }: CompetitionFeedProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CompetitionFeedContent competitionId={competitionId} />
    </QueryClientProvider>
  );
}

// The actual component content
function CompetitionFeedContent({ competitionId }: CompetitionFeedProps) {
  const searchParams = useSearchParams();
  const roundId = searchParams.get("round");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Get advertisements for this competition
  const advertisementsEnabled = true; // Assume advertisements are enabled by default
  const { advertisements, isLoading: adsLoading, error: adsError, refetch: refetchAds } = useCompetitionAdvertisements(competitionId);

  // State to track if we're showing random posts
  const [showRandom, setShowRandom] = useState(true);

  // Log advertisement state for debugging
  debug.log("CompetitionFeed - Advertisement state:", {
    enabled: advertisementsEnabled,
    competitionId,
    count: advertisements?.length || 0,
    loading: adsLoading,
    error: adsError ? (adsError instanceof Error ? adsError.message : String(adsError)) : null
  });

  // Force refetch advertisements if they're enabled
  useEffect(() => {
    if (advertisementsEnabled) {
      debug.log("Competition advertisements are enabled, refetching...");
      refetchAds();
    }
  }, [advertisementsEnabled, refetchAds]);

  // Create a stable query key that doesn't change on re-renders
  // Add a timestamp to ensure we get fresh data after competition updates
  const queryKey = ["competition-feed", competitionId, roundId || null, showRandom];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      try {
        const params: Record<string, string> = { competitionId };
        if (roundId) params.roundId = roundId;
        if (pageParam) params.cursor = pageParam;
        // Add random parameter
        params.random = showRandom.toString();
        // Add a timestamp to prevent caching
        params.timestamp = Date.now().toString();

        debug.log('Fetching competition posts with params:', params);
        const response = await apiClient.get<PostsPage>("/api/posts/competition-feed", {
          params,
          // Disable caching at the fetch level to ensure fresh data
          cache: 'no-store'
        });
        debug.log('Competition posts response:', response.data);
        return response.data;
      } catch (error) {
        debug.error("Error fetching competition posts:", error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load posts');
        throw error;
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Ensure we get fresh data when switching between views
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Force a refetch when the roundId or random setting changes
  useEffect(() => {
    refetch();
  }, [roundId, showRandom, refetch]);

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Function to get a random advertisement from the available ones
  const getRandomAd = useCallback(() => {
    if (!advertisements || !advertisements.length) return null;
    const randomIndex = Math.floor(Math.random() * advertisements.length);
    return advertisements[randomIndex];
  }, [advertisements]);

  // Create a new array with advertisements inserted at specified intervals
  const postsWithAds = useMemo(() => {
    // Start measuring performance
    const endMeasure = startMeasure('competition-postsWithAds-calculation');

    if (!advertisementsEnabled || !advertisements || !advertisements.length) {
      endMeasure();
      return posts;
    }

    // Track which ads have been used to ensure variety
    const usedAdIds = new Set<string>();
    let adInsertionFrequency = 3; // Default frequency - show ads more frequently

    // If we have very few posts, make sure we still show at least one ad
    const shouldForceAd = posts.length > 0 && posts.length < 5;
    debug.log(`Competition posts count: ${posts.length}, shouldForceAd: ${shouldForceAd}`);

    const result = posts.reduce((acc: any[], post, index) => {
      acc.push(post);

      // Check if we should insert an ad after this post
      // Insert first ad after the 2nd post, then follow the frequency
      // Also force an ad after the first post if we have very few posts
      if (((index === 1 || (index + 1) % adInsertionFrequency === 0) && index < posts.length - 1) ||
          (shouldForceAd && index === 0)) {
        // Get a random ad, preferring ones we haven't used yet
        let attempts = 0;
        let ad = null;

        // Try to find an ad we haven't used yet, but limit attempts to avoid infinite loop
        while (attempts < advertisements.length) {
          const randomAd = getRandomAd();
          if (randomAd && (!usedAdIds.has(randomAd.id) || usedAdIds.size >= advertisements.length)) {
            ad = randomAd;
            usedAdIds.add(ad.id);
            break;
          }
          attempts++;
        }

        // If we couldn't find a new ad, just get any random one
        if (!ad) {
          ad = getRandomAd();
        }

        if (ad) {
          // Update the insertion frequency for future ads based on this ad's preference
          adInsertionFrequency = ad.displayFrequency;

          const adItem = {
            id: `ad-${ad.id}-${index}`,
            isAdvertisement: true,
            advertisement: ad,
          };

          acc.push(adItem);
          debug.log(`Added advertisement ${ad.id} after post at index ${index}`);
        }
      }

      return acc;
    }, [] as any[]);

    // End measuring performance
    endMeasure();
    return result;
  }, [posts, advertisements, advertisementsEnabled, getRandomAd]);

  // Render different content based on status, but avoid early returns
  let content;

  if (status === "pending") {
    content = <PostsLoadingSkeleton />;
  } else if (status === "error" || errorMessage) {
    content = (
      <div className="p-4 text-center border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <p className="text-red-500 dark:text-red-400">Error loading posts: {errorMessage || (error instanceof Error ? error.message : 'Unknown error')}</p>
      </div>
    );
  } else if (posts.length === 0) {
    content = (
      <div className="p-8 text-center border border-border rounded-lg bg-card/50">
        <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
        <p className="text-muted-foreground">
          {roundId
            ? "There are no posts for this round yet. Participants need to upload their entries for this round."
            : "There are no posts for this competition yet."}
        </p>
        {roundId && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              If you're a participant, you can upload your entry in the "Upload" tab.
            </p>
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <InfiniteScrollContainer
        className="space-y-4"
        onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
      >
        {postsWithAds.map((item) => {
          // Check if this item is an advertisement
          if ('isAdvertisement' in item && item.isAdvertisement) {
            const ad = item.advertisement;
            // Make sure the ad has all required properties
            if (!ad || !ad.media || !ad.media.url) {
              return null;
            }

            return (
              <Advertisement
                key={item.id}
                id={ad.id}
                title={ad.title}
                mediaUrl={ad.media.url}
                mediaType={ad.adType}
                skipDuration={ad.skipDuration}
                url={ad.url}
              />
            );
          }
          // Regular post
          return <Post key={item.id} post={item} competitionId={competitionId} />;
        })}
        {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
      </InfiniteScrollContainer>
    );
  }

  // Always return the same structure to ensure consistent hook calls
  return content;
}
