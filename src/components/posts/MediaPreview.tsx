"use client";

import { Media, StickerPosition } from "@prisma/client";
import { Heart } from "lucide-react";
import { useState, useRef, useCallback, memo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLike } from "./useLike";
import { startMeasure } from "@/lib/performance-monitor";
import CustomImage from "../ui/CustomImage";
import { useFeedStickers } from "@/hooks/use-feed-stickers";
import { useCompetitionFeedStickers } from "@/hooks/use-competition-feed-stickers";
import debug from "@/lib/debug";

// Dynamically import heavy components
const ImageWithSticker = dynamic(() => import("../competitions/ImageWithSticker"), {
  ssr: false,
});

const VideoWithSticker = dynamic(() => import("../competitions/VideoWithSticker"), {
  ssr: false,
});

const CustomVideoPlayer = dynamic(() => import("../ui/CustomVideoPlayer"), {
  ssr: false,
});

const FeedStickerOverlay = dynamic(() => import("../feed/FeedStickerOverlay"), {
  ssr: false,
});

interface MediaPreviewProps {
  media: Media & {
    appliedPromotionSticker?: {
      id: string;
      imageUrl: string;
      position: StickerPosition;
    } | null;
  };
  postId: string;
  initialLikeState: {
    likes: number;
    isLikedByUser: boolean;
  };
  competitionId?: string; // Optional competition ID for competition-specific stickers
}

function MediaPreview({ media, postId, initialLikeState, competitionId }: MediaPreviewProps) {
  // Start measuring performance
  const endMeasure = startMeasure('media-preview-render');
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
    if (!competitionId) return; // Only run for competition feeds

    // Function to check feed stickers setting
    const checkSetting = async () => {
      try {
        // Use the competition-specific endpoint
        const endpoint = `/api/competitions/${competitionId}/feed-stickers-setting`;

        debug.log(`MediaPreview: Fetching feed stickers setting from ${endpoint}`);
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        debug.log(`MediaPreview: Competition ${competitionId} feed stickers enabled: ${data.showFeedStickers}`);

        // Update the state with the server value
        setShowFeedStickers(data.showFeedStickers);

        // If stickers are enabled and we don't have a sticker yet, get one
        if (data.showFeedStickers === true && !stickerInfo) {
          debug.log(`MediaPreview: Getting random sticker for competition feed`);
          const sticker = getRandomSticker();

          if (sticker && sticker.imageUrl) {
            debug.log(`MediaPreview: Using sticker: ${sticker.stickerId} at position ${sticker.position}`);
            incrementStickerUsage(sticker.stickerId);
            setStickerInfo(sticker);
          } else {
            debug.log('MediaPreview: No valid sticker found');
          }
        }
      } catch (error) {
        debug.error("Error checking feed stickers setting:", error);
      }
    };

    // Check immediately
    checkSetting();
  }, [competitionId, getRandomSticker, incrementStickerUsage, stickerInfo]);

  // Heart animation overlay component - memoize to prevent re-renders
  const HeartAnimation = useCallback(() => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <Heart className="text-white fill-white size-20 animate-heart-beat drop-shadow-lg" />
    </div>
  ), []);

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

  // End measuring performance before returning
  endMeasure();

  // Use a variable to store the content instead of early returns
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
    // Check if this image has an applied promotion sticker
    if (media.appliedPromotionStickerId && media.appliedPromotionSticker) {
      content = (
        <div className="flex items-center justify-center w-full">
          <div
            className="w-full h-full overflow-hidden relative"
            style={{ maxHeight: 'calc(100vh - 250px)' }}
            onDoubleClick={handleDoubleClick}
          >
            {/* Use ImageWithSticker component to properly display sticker */}
            <ImageWithSticker
              imageSrc={media.url}
              stickerSrc={media.appliedPromotionSticker.imageUrl}
              stickerPosition={media.appliedPromotionSticker.position}
              className="w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              onError={() => setError(true)}
              priority={true}
              loading="eager"
              key={`stickered-image-${media.id}`}
            />
            {showHeartAnimation && <HeartAnimation />}
          </div>
        </div>
      );
    } else {
      // Regular image without permanent sticker, but may have competition feed sticker
      content = (
        <div className="flex items-center justify-center w-full">
          <div
            ref={containerRef}
            className="w-full h-full overflow-hidden relative"
            onDoubleClick={handleDoubleClick}
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            <div className="relative w-full h-full" style={{ zIndex: 1 }}>
              <CustomImage
                src={media.url}
                alt="Attachment"
                fill
                className="object-contain"
                priority={true} // Add priority to improve loading performance
                loading="eager" // Force eager loading for visible images
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            </div>

            {/* Apply competition feed sticker overlay using CSS */}
            {competitionId && showFeedStickers === true && stickerInfo ? (
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
    }
  } else if (media.type === "VIDEO") {
    // Check if this video has an applied promotion sticker
    if (media.appliedPromotionStickerId && media.appliedPromotionSticker) {
      content = (
        <div className="flex items-center justify-center w-full">
          <div
            className="relative w-full h-full"
            onDoubleClick={handleDoubleClick}
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            {/* Use VideoWithSticker component to properly display sticker */}
            <VideoWithSticker
              videoSrc={media.url}
              stickerSrc={media.appliedPromotionSticker.imageUrl}
              stickerPosition={media.appliedPromotionSticker.position}
              className="w-full h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              onError={() => setError(true)}
              key={`stickered-video-${media.id}`}
            />
            {showHeartAnimation && <HeartAnimation />}
          </div>
        </div>
      );
    } else {
      // Regular video without permanent sticker, but may have competition feed sticker
      content = (
        <div className="flex items-center justify-center w-full">
          <div
            ref={containerRef}
            className="w-full overflow-hidden relative"
            style={{ maxHeight: 'calc(100vh - 250px)' }}
          >
            <div className="relative w-full" style={{ zIndex: 1 }}>
              <CustomVideoPlayer
                src={media.url}
                onError={() => setError(true)}
                onDoubleClick={handleDoubleClick}
                className="w-full h-full"
                key={`video-${media.id}`}
              />
            </div>

            {/* Apply competition feed sticker overlay using CSS */}
            {competitionId && showFeedStickers === true && stickerInfo ? (
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
    }
  } else {
    content = <p className="text-destructive">Unsupported media type</p>;
  }

  // Always return the content variable
  return content;
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MediaPreview);
