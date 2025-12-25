"use client";

import { Media } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback, memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { startMeasure } from "@/lib/performance-monitor";

// Dynamically import FeedMediaPreview with no SSR to improve initial load time
const FeedMediaPreview = dynamic(() => import("./FeedMediaPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/10 animate-pulse rounded-md">
      <span className="sr-only">Loading media...</span>
    </div>
  ),
});

interface FeedMediaPreviewsProps {
  attachments: Array<Media>;
  postId: string;
  initialLikeState: {
    likes: number;
    isLikedByUser: boolean;
  };
}

function FeedMediaPreviews({ attachments, postId, initialLikeState }: FeedMediaPreviewsProps) {
  // Start rendering media previews

  // Start measuring performance
  const endMeasure = startMeasure('feed-media-previews-render');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // For multiple attachments, create a slider
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? attachments.length - 1 : prev - 1));
  }, [attachments.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === attachments.length - 1 ? 0 : prev + 1));
  }, [attachments.length]);

  // Add keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  }, [handlePrevious, handleNext]);

  // Add touch gestures for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }

    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, handleNext, handlePrevious]);

  // Memoize the attachments to prevent unnecessary re-renders
  const memoizedAttachments = useMemo(() => attachments, [attachments]);

  // End measuring performance
  endMeasure();

  // Use conditional rendering instead of early returns
  let content;

  if (attachments.length === 1) {
    content = (
      <div className="flex flex-col gap-3">
        <FeedMediaPreview
          media={attachments[0]}
          postId={postId}
          initialLikeState={initialLikeState}
        />
      </div>
    );
  } else {
    content = (
      <div
        className="relative"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Image gallery">
        {/* Current media display */}
        <div className="relative rounded-xl overflow-hidden bg-black/5 border border-border/20">
          <div
            className="flex w-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {memoizedAttachments.map((attachment) => (
              <div key={attachment.id} className="w-full flex-shrink-0 flex items-center justify-center">
                <FeedMediaPreview
                  media={attachment}
                  postId={postId}
                  initialLikeState={initialLikeState}
                />
              </div>
            ))}
          </div>

          {/* Navigation arrows - only show when hovering over the image */}
          {memoizedAttachments.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm transition-all opacity-0 group-hover/post:opacity-100 focus:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm transition-all opacity-0 group-hover/post:opacity-100 focus:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Media counter indicator */}
          {memoizedAttachments.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full shadow-sm z-20 backdrop-blur-sm">
              {currentIndex + 1} of {memoizedAttachments.length}
            </div>
          )}
        </div>

        {/* Navigation dots */}
        {memoizedAttachments.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {Array.from({ length: memoizedAttachments.length }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-primary scale-125' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`View image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return content;
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FeedMediaPreviews);
