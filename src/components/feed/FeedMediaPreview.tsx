"use client";

import { Media, StickerPosition } from "@prisma/client";
import { Heart } from "lucide-react";
import React, { useState, useRef, useCallback, memo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLike } from "../posts/useLike";
import { startMeasure } from "@/lib/performance-monitor";
import CustomImage from "../ui/CustomImage";
import FeedStickerOverlay from "./FeedStickerOverlay";
import { useFeedStickers } from "@/hooks/use-feed-stickers";
import { useCompetitionFeedStickers } from "@/hooks/use-competition-feed-stickers";
import debug from "@/lib/debug";

// Dynamically import heavy components
const CustomVideoPlayer = dynamic(() => import("../ui/CustomVideoPlayer"), {
  ssr: false,
});

interface FeedMediaPreviewProps {
  media: Media;
  postId: string;
  initialLikeState: {
    likes: number;
    isLikedByUser: boolean;
  };
  competitionId?: string; // Optional competition ID for competition-specific stickers
}

function FeedMediaPreview({ media, postId, initialLikeState, competitionId }: FeedMediaPreviewProps) {
  // Start measuring performance
  const endMeasure = startMeasure('feed-media-preview-render');
  const [error, setError] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { like } = useLike(postId, initialLikeState);

  // Get stickers from the appropriate context based on whether we're in a competition
  const globalFeedStickers = useFeedStickers();
  const competitionFeedStickers = useCompetitionFeedStickers();

  // Use competition stickers if competitionId is provided, otherwise use global stickers
  const {
    getRandomSticker,
    incrementStickerUsage,
    resetUsageCounts
  } = competitionId ? competitionFeedStickers : globalFeedStickers;

  const [stickerInfo, setStickerInfo] = useState<{ stickerId: string; imageUrl: string; position: StickerPosition } | null>(null);
  const [showFeedStickers, setShowFeedStickers] = useState<boolean | null>(null);

  // Track if we've already reset usage counts for this session
  const hasResetCounts = useRef(false);

  // Check the server setting with better caching
  useEffect(() => {
    // Keep track of the last fetch time to avoid too many requests
    let lastFetchTime = 0;
    const FETCH_INTERVAL = 30000; // 30 seconds between checks

    const checkSetting = async () => {
      try {
        // Only fetch if enough time has passed since the last fetch
        const now = Date.now();
        if (now - lastFetchTime < FETCH_INTERVAL && showFeedStickers !== null) {
          return; // Skip this fetch if we've fetched recently and have a value
        }

        lastFetchTime = now;

        // Reset usage counts on first page load (not on subsequent API calls)
        // This ensures counts are reset when the user refreshes the page
        if (!hasResetCounts.current) {
          debug.log("Resetting feed sticker usage counts on page load");
          resetUsageCounts();
          hasResetCounts.current = true;
        }

        // Use the appropriate endpoint based on whether we're in a competition
        const endpoint = competitionId
          ? `/api/competitions/${competitionId}/feed-stickers-setting`
          : "/api/settings/feed-stickers";

        debug.log(`Fetching feed stickers setting from ${endpoint}`);
        const response = await fetch(endpoint, {
          next: { revalidate: 30 } // Use Next.js cache for 30 seconds
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        // Only log if the value changed or it's the first fetch
        if (showFeedStickers !== data.showFeedStickers) {
          debug.log("Feed stickers setting changed:", {
            previous: showFeedStickers,
            current: data.showFeedStickers,
            isCompetition: !!competitionId
          });
        }

        // Update the state with the server value
        setShowFeedStickers(data.showFeedStickers);

        // If stickers are disabled, clear any existing sticker
        if (data.showFeedStickers === false) {
          setStickerInfo(null);
        }
        // If stickers are enabled and we don't have a sticker yet, get one
        else if (data.showFeedStickers === true && !stickerInfo) {
          debug.log(`Getting random sticker for ${competitionId ? 'competition' : 'global'} feed`);
          const sticker = getRandomSticker();
          debug.log('Random sticker result:', sticker);

          if (sticker && sticker.imageUrl) {
            debug.log(`Using sticker: ${sticker.stickerId} at position ${sticker.position}`);
            incrementStickerUsage(sticker.stickerId);
            setStickerInfo(sticker);
          } else {
            debug.log('No valid sticker found');
          }
        }
      } catch (error) {
        debug.error("Error checking feed stickers setting:", error);
      }
    };

    // Check immediately
    checkSetting();

    // Then check periodically, but less frequently (every 30 seconds)
    const interval = setInterval(checkSetting, FETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [getRandomSticker, incrementStickerUsage, resetUsageCounts, stickerInfo, showFeedStickers, competitionId]);

  // Handle double click to like
  const handleDoubleClick = useCallback(() => {
    // Show heart animation
    setShowHeartAnimation(true);

    // Hide heart animation after 1 second
    setTimeout(() => {
      setShowHeartAnimation(false);
    }, 1000);

    // Call like function
    like();
  }, [like]);

  // Heart animation overlay component - memoize to prevent re-renders
  const HeartAnimation = useCallback(() => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <Heart className="text-white fill-white size-20 animate-heart-beat drop-shadow-lg" />
    </div>
  ), []);

  // End measuring performance before returning
  endMeasure();

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Only log on first render
  useEffect(() => {
    if (isFirstRender.current) {
      debug.log("Initial render of FeedMediaPreview", {
        mediaId: media.id,
        showFeedStickers,
        hasStickerInfo: !!stickerInfo,
        isCompetition: !!competitionId,
        competitionId: competitionId || 'none'
      });
      isFirstRender.current = false;
    }
  }, [media.id, showFeedStickers, stickerInfo, competitionId]);

  // Use conditional rendering instead of early returns
  let content;

  if (error) {
    content = (
      <div className="flex items-center justify-center h-64 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl">
        <div className="text-center p-4">
          {media.type === "VIDEO" ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Video Unavailable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This video could not be loaded. It may have been removed or is temporarily unavailable.
              </p>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">Failed to load media</p>
            </>
          )}
        </div>
      </div>
    );
  } else if (media.type === "IMAGE") {
    content = (
      <div className="flex items-center justify-center w-full">
        <div
          ref={containerRef}
          className="w-full relative"
          onDoubleClick={handleDoubleClick}
        >
          {/* Image container with auto height to maintain aspect ratio */}
          <div className="relative w-full" style={{ zIndex: 1 }}>
            <CustomImage
              src={media.url}
              alt="Attachment"
              className="object-contain w-full h-auto max-w-full"
              priority={true}
              loading="eager"
              style={{
                maxHeight: 'calc(100vh - 250px)',
                width: 'auto',
                margin: '0 auto',
                display: 'block'
              }}
              width={1200}
              height={800}
            />
          </div>

          {/* Apply sticker overlay using CSS - only when showFeedStickers is true */}
          {showFeedStickers === true && stickerInfo ? (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
              <FeedStickerOverlay
                stickerSrc={stickerInfo.imageUrl}
                stickerPosition={stickerInfo.position}
                containerRef={containerRef}
                showBackground={true}
                backgroundColor="white"
                backgroundOpacity={0.7}
                backgroundBlur={false}
              />
              {/* Debug info removed */}
            </div>
          ) : null}

          {showHeartAnimation && <HeartAnimation />}
        </div>
      </div>
    );
  } else if (media.type === "VIDEO") {
    content = (
      <div className="flex items-center justify-center w-full">
        <div
          ref={containerRef}
          className="w-full relative"
        >
          {/* Video container with proper aspect ratio */}
          <div className="relative w-full" style={{ zIndex: 1 }}>
            <CustomVideoPlayer
              src={media.url}
              onError={() => setError(true)}
              onDoubleClick={handleDoubleClick}
              className="w-full"
              style={{
                maxHeight: 'calc(100vh - 250px)',
                margin: '0 auto'
              }}
              key={`video-${media.id}`}
            />
          </div>

          {/* Apply sticker overlay using CSS - only when showFeedStickers is true */}
          {showFeedStickers === true && stickerInfo ? (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
              <FeedStickerOverlay
                stickerSrc={stickerInfo.imageUrl}
                stickerPosition={stickerInfo.position}
                containerRef={containerRef}
                showBackground={true}
                backgroundColor="white"
                backgroundOpacity={0.7}
                backgroundBlur={false}
              />
              {/* Debug info removed */}
            </div>
          ) : null}

          {showHeartAnimation && <HeartAnimation />}
        </div>
      </div>
    );
  } else {
    content = <p className="text-destructive">Unsupported media type</p>;
  }

  return content;
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FeedMediaPreview);
