"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Advertisement from "@/components/advertisements/Advertisement";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { useAdvertisements } from "@/hooks/use-advertisements";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { useStickeredMediaSetting } from "@/hooks/use-stickered-media-setting";
import apiClient from "@/lib/api-client";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { startMeasure } from "@/lib/performance-monitor";
import { FeedStickersProvider } from "@/hooks/use-feed-stickers";
import { FeedStickersSettingProvider } from "@/hooks/use-feed-stickers-setting";
import FeedPost from "@/components/feed/FeedPost";

import debug from "@/lib/debug";

export default function ForYouFeed() {
  const { advertisementsEnabled } = useFeatureSettings();
  const { advertisements, isLoading: adsLoading, error: adsError, refetch: refetchAds } = useAdvertisements();
  const { showStickeredMedia } = useStickeredMediaSetting();

  // State to track if we're showing random posts
  const [showRandom, setShowRandom] = useState(true);

  // Log advertisement state for debugging
  debug.log("ForYouFeed - Advertisement state:", {
    enabled: advertisementsEnabled,
    count: advertisements?.length || 0,
    loading: adsLoading,
    error: adsError ? (adsError instanceof Error ? adsError.message : String(adsError)) : null
  });

  // Force refetch advertisements if they're enabled
  useEffect(() => {
    if (advertisementsEnabled) {
      debug.log("Advertisements are enabled, refetching...");
      refetchAds();
    }
  }, [advertisementsEnabled, refetchAds]);

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
    queryKey: ["post-feed", "for-you", showStickeredMedia, showRandom], // Add showRandom to the query key
    queryFn: async ({ pageParam }) => {
      try {
        debug.log(`Fetching for-you feed with showStickeredMedia=${showStickeredMedia}, random=${showRandom}`);
        const response = await apiClient.get<PostsPage>("/api/posts/for-you", {
          params: {
            ...(pageParam ? { cursor: pageParam } : {}),
            showStickeredMedia: showStickeredMedia, // Pass the setting to the API
            random: showRandom, // Pass the random setting to the API
          },
        });
        return response.data;
      } catch (error: any) {
        debug.error("Error fetching posts:", error);

        // Handle rate limiting errors with retry logic
        if (error.status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'] || 60;
          const errorMessage = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
          throw new Error(errorMessage);
        }

        // Handle authentication errors gracefully
        if (error.status === 401) {
          // Return empty data for guest users instead of throwing an error
          return { posts: [], nextCursor: null };
        }

        // Add more detailed error information for other errors
        const errorMessage = error.response?.data?.error || error.message || "Failed to load posts";
        throw new Error(errorMessage);
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Optimize caching and refetching behavior
    staleTime: 5 * 60 * 1000, // 5 minutes (increased from 0)
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Only refetch on reconnect
    retry: (failureCount, error: any) => {
      // Don't retry on rate limiting errors
      if (error?.status === 429) return false;
      // Don't retry on authentication errors
      if (error?.status === 401) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  // Force a refetch when the stickered media setting or random setting changes
  useEffect(() => {
    debug.log("Stickered media or random setting changed, refetching for-you feed");
    refetch();
  }, [showStickeredMedia, showRandom, refetch]);

  // Function to get a random advertisement from the available ones
  const getRandomAd = () => {
    if (!advertisements || !advertisements.length) return null;
    const randomIndex = Math.floor(Math.random() * advertisements.length);
    return advertisements[randomIndex];
  };

  // Create a new array with advertisements inserted at specified intervals
  const postsWithAds = useMemo(() => {
    // Start measuring performance
    const endMeasure = startMeasure('postsWithAds-calculation');

    if (!advertisementsEnabled || !advertisements || !advertisements.length) {
      endMeasure();
      return posts;
    }

    // Track which ads have been used to ensure variety
    const usedAdIds = new Set<string>();
    let adInsertionFrequency = 3; // Default frequency - show ads more frequently

    // If we have very few posts, make sure we still show at least one ad
    const shouldForceAd = posts.length > 0 && posts.length < 5;
    debug.log(`Posts count: ${posts.length}, shouldForceAd: ${shouldForceAd}`);

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
        }
      }

      return acc;
    }, [] as any[]);

    // End measuring performance
    endMeasure();
    return result;
  }, [posts, advertisements, advertisementsEnabled]);

  // Track if we're currently fetching more posts
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Callback for fetching more posts
  const fetchMorePosts = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingMore) {
      setIsFetchingMore(true);
      fetchNextPage().finally(() => {
        setIsFetchingMore(false);
      });
    }
  }, [hasNextPage, isFetching, isFetchingMore, fetchNextPage]);

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
        <p className="text-center text-muted-foreground">
          No one has posted anything yet.
        </p>
      </div>
    );
  }

  if (status === "error") {
    debug.error("Error in ForYouFeed:", error);
    const isRateLimited = error instanceof Error && error.message.includes("Too many requests");

    return (
      <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold mb-4 text-destructive">Error Loading Posts</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "An error occurred while loading posts."}
        </p>
        {isRateLimited ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please wait a moment before refreshing to avoid hitting rate limits.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <FeedStickersSettingProvider>
      <FeedStickersProvider>
        <InfiniteScrollContainer
          className="space-y-4"
          onBottomReached={fetchMorePosts}
          throttleTime={800}
        >
          {postsWithAds.map((item) => {
            // Check if this item is an advertisement
            if ('isAdvertisement' in item && item.isAdvertisement) {
              const ad = item.advertisement;
              // Make sure the ad has all required properties
              if (!ad) {
                return null;
              }

              // Advertisement details

              return (
                <Advertisement
                  key={item.id}
                  id={ad.id}
                  title={ad.title}
                  mediaUrl={ad.media?.url}
                  mediaType={ad.adType}
                  skipDuration={ad.skipDuration}
                  url={ad.url}
                />
              );
            }
            // Regular post - use our new FeedPost component
            return <FeedPost key={item.id} post={item} />;
          })}
          {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
        </InfiniteScrollContainer>
      </FeedStickersProvider>
    </FeedStickersSettingProvider>
  );
}
