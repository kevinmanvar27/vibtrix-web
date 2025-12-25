'use client';

import { StickerPosition } from '@prisma/client';
import { memo, useEffect, useState } from 'react';
import Image from 'next/image';
import debug from '@/lib/debug';

interface FeedStickerOverlayProps {
  stickerSrc: string;
  stickerPosition: StickerPosition;
  containerRef: React.RefObject<HTMLDivElement>;
  className?: string;
  showBackground?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  backgroundBlur?: boolean;
}

/**
 * A component that overlays a sticker on media using CSS positioning
 * This is used for feed stickers that are applied via CSS rather than server-side processing
 */
function FeedStickerOverlay({
  stickerSrc,
  stickerPosition,
  containerRef,
  className = '',
  showBackground = true,
  backgroundColor = 'white',
  backgroundOpacity = 0.7,
  backgroundBlur = true,
}: FeedStickerOverlayProps) {
  const [stickerSize, setStickerSize] = useState({ width: 0, height: 0 });
  const [stickerStyles, setStickerStyles] = useState<React.CSSProperties>({});

  // Calculate sticker position and size based on container and position prop
  useEffect(() => {
    if (!stickerSrc || !containerRef.current) {
      debug.log('FeedStickerOverlay: Missing stickerSrc or containerRef', {
        hasStickerSrc: !!stickerSrc,
        hasContainerRef: !!containerRef.current
      });
      return;
    }

    debug.log('FeedStickerOverlay: Calculating sticker styles', {
      stickerSrc,
      position: stickerPosition
    });

    // Function to calculate sticker position
    const calculateStickerStyles = () => {
      const containerElement = containerRef.current;
      if (!containerElement) return;

      // Find the actual media element (img or video) within the container
      const mediaElement = containerElement.querySelector('img') ||
                           containerElement.querySelector('video') ||
                           containerElement;

      // Get the bounding rectangles for both container and media
      const containerRect = containerElement.getBoundingClientRect();
      const mediaRect = mediaElement.getBoundingClientRect();

      // Calculate the media's position relative to the container
      const mediaOffsetTop = mediaRect.top - containerRect.top;
      const mediaOffsetLeft = mediaRect.left - containerRect.left;

      // Use the actual media dimensions for calculations
      const mediaWidth = mediaRect.width;
      const mediaHeight = mediaRect.height;

      debug.log('FeedStickerOverlay: Media dimensions', {
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
        mediaWidth,
        mediaHeight,
        mediaOffsetTop,
        mediaOffsetLeft,
        aspectRatio: mediaWidth / mediaHeight
      });

      // Calculate sticker size (20% of media width for better proportions and visibility)
      // The sticker size is now the actual image size, not including padding
      const stickerWidth = Math.round(mediaWidth * 0.20);
      const stickerHeight = stickerWidth;

      setStickerSize({
        width: stickerWidth,
        height: stickerHeight
      });

      // Calculate position based on stickerPosition prop
      const padding = Math.round(mediaWidth * 0.03); // 3% padding from edges for better visibility
      let top, right, bottom, left;
      let transform = '';

      switch (stickerPosition) {
        case 'TOP_LEFT':
          top = mediaOffsetTop + padding;
          left = mediaOffsetLeft + padding;
          break;
        case 'TOP_RIGHT':
          top = mediaOffsetTop + padding;
          right = (containerRect.width - (mediaOffsetLeft + mediaWidth)) + padding;
          break;
        case 'BOTTOM_LEFT':
          bottom = (containerRect.height - (mediaOffsetTop + mediaHeight)) + padding;
          left = mediaOffsetLeft + padding;
          break;
        case 'BOTTOM_RIGHT':
          bottom = (containerRect.height - (mediaOffsetTop + mediaHeight)) + padding;
          right = (containerRect.width - (mediaOffsetLeft + mediaWidth)) + padding;
          break;
        case 'CENTER':
          // Position relative to the media center, not the container center
          top = mediaOffsetTop + (mediaHeight / 2);
          left = mediaOffsetLeft + (mediaWidth / 2);
          transform = 'translate(-50%, -50%)'; // Center the sticker
          break;
        default:
          // Default to BOTTOM_RIGHT if position is invalid
          bottom = (containerRect.height - (mediaOffsetTop + mediaHeight)) + padding;
          right = (containerRect.width - (mediaOffsetLeft + mediaWidth)) + padding;
          debug.warn('Invalid sticker position:', stickerPosition);
          break;
      }

      // Set styles for the sticker container
      const styles: React.CSSProperties = {
        position: 'absolute',
        width: `${stickerWidth}px`,
        height: `${stickerHeight}px`,
        zIndex: 10, // Higher z-index to ensure it's above the image (which has z-index: 1)
      };

      if (top !== undefined) styles.top = top;
      if (right !== undefined) styles.right = right;
      if (bottom !== undefined) styles.bottom = bottom;
      if (left !== undefined) styles.left = left;

      // Add transform if defined
      if (transform) {
        styles.transform = transform;
      }

      debug.log('FeedStickerOverlay: Calculated styles', {
        position: stickerPosition,
        stickerWidth,
        stickerHeight,
        styles
      });

      setStickerStyles(styles);
    };

    // Calculate on mount and window resize
    calculateStickerStyles();

    const resizeObserver = new ResizeObserver(() => {
      calculateStickerStyles();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', calculateStickerStyles);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', calculateStickerStyles);
    };
  }, [stickerSrc, stickerPosition, containerRef]);

  if (!stickerSrc) {
    return null;
  }

  // Ready to render sticker

  // Create a wrapper div for the sticker with proper positioning
  return (
    <div
      style={stickerStyles}
      className={`pointer-events-none ${className}`}
      data-sticker-position={stickerPosition}
    >
      {/* Direct image with background styling */}
      <div className="relative inline-block">
        {/* Background element positioned behind the image */}
        {showBackground && (
          <div
            className="absolute rounded-lg shadow-md"
            style={{
              backgroundColor: backgroundColor,
              opacity: backgroundOpacity,
              top: '-8px',
              left: '-8px',
              right: '-8px',
              bottom: '-8px',
              zIndex: 1,
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          />
        )}

        {/* The actual sticker image */}
        <div className="relative z-10 p-0.5">
          <Image
            src={stickerSrc}
            alt="Feed Sticker"
            width={stickerSize.width || 100}
            height={stickerSize.height || 100}
            className="object-contain"
            unoptimized={true}
            onError={(e) => {
              debug.error(`Failed to load feed sticker image:`, e);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FeedStickerOverlay);
