'use client';

import { useId, memo, useEffect, useState } from 'react';
import { StickerPosition } from '@prisma/client';
import Image from 'next/image';

import CustomVideoPlayer from '@/components/ui/CustomVideoPlayer';
import debug from '@/lib/debug';

interface VideoWithStickerProps {
  videoSrc: string;
  stickerSrc?: string;
  stickerPosition?: StickerPosition;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onError?: () => void;
  urlHigh?: string;
  urlMedium?: string;
  urlLow?: string;
  urlThumbnail?: string;
  posterUrl?: string;
  adaptiveQuality?: boolean;
}

function VideoWithSticker({
  videoSrc,
  stickerSrc,
  stickerPosition = 'BOTTOM_RIGHT',
  className = '',
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  onError,
  urlHigh,
  urlMedium,
  urlLow,
  urlThumbnail,
  posterUrl,
  adaptiveQuality = true,
}: VideoWithStickerProps) {
  // Generate a unique ID for this component instance
  const instanceId = useId();
  const [stickerSize, setStickerSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [stickerStyles, setStickerStyles] = useState({});

  // Calculate sticker position and size based on container and position prop
  useEffect(() => {
    if (!stickerSrc) return;

    // Function to calculate sticker position
    const calculateStickerStyles = () => {
      const containerElement = document.querySelector(`[data-video-id="${instanceId}"]`);
      if (!containerElement) return;

      const containerRect = containerElement.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Set container size for reference
      setContainerSize({
        width: containerWidth,
        height: containerHeight
      });

      // Calculate sticker size (20% of container width)
      const stickerWidth = Math.round(containerWidth * 0.2);
      const stickerHeight = stickerWidth; // Assuming square sticker, adjust if needed

      setStickerSize({
        width: stickerWidth,
        height: stickerHeight
      });

      // Calculate position based on stickerPosition prop
      const padding = Math.round(containerWidth * 0.03); // 3% padding for consistency with other sticker implementations
      let top, right, bottom, left;

      switch (stickerPosition) {
        case 'TOP_LEFT':
          top = padding;
          left = padding;
          break;
        case 'TOP_RIGHT':
          top = padding;
          right = padding;
          break;
        case 'BOTTOM_LEFT':
          bottom = padding;
          left = padding;
          break;
        case 'BOTTOM_RIGHT':
        default:
          bottom = padding;
          right = padding;
          break;
        case 'CENTER':
          top = '50%';
          left = '50%';
          break;
      }

      // Set styles for the sticker
      const styles: any = {
        position: 'absolute',
        width: `${stickerWidth}px`,
        height: `${stickerHeight}px`,
        zIndex: 10, // Consistent z-index across all sticker implementations
      };

      if (top !== undefined) styles.top = top;
      if (right !== undefined) styles.right = right;
      if (bottom !== undefined) styles.bottom = bottom;
      if (left !== undefined) styles.left = left;

      // For center position, add transform
      if (stickerPosition === 'CENTER') {
        styles.transform = 'translate(-50%, -50%)';
      }

      setStickerStyles(styles);
    };

    // Calculate on mount and window resize
    calculateStickerStyles();
    window.addEventListener('resize', calculateStickerStyles);

    return () => {
      window.removeEventListener('resize', calculateStickerStyles);
    };
  }, [stickerSrc, stickerPosition, instanceId]);

  return (
    <div
      className={`relative w-full ${className}`}
      data-video-id={instanceId}
      style={{ maxHeight: 'calc(100vh - 250px)' }}
    >
      <CustomVideoPlayer
        src={videoSrc}
        className="w-full h-auto max-h-full"
        onError={onError}
        urlHigh={urlHigh}
        urlMedium={urlMedium}
        urlLow={urlLow}
        urlThumbnail={urlThumbnail}
        poster={posterUrl}
        adaptiveQuality={adaptiveQuality}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
      />

      {/* Sticker overlay */}
      {stickerSrc && (
        <div
          style={stickerStyles}
          className="pointer-events-none"
          data-sticker-position={stickerPosition}
        >
          {/* Background element positioned behind the image */}
          <div className="relative inline-block">
            <div
              className="absolute rounded-lg shadow-md"
              style={{
                backgroundColor: 'white',
                opacity: 0.7, // Consistent opacity across all sticker implementations
                top: '-8px',
                left: '-8px',
                right: '-8px',
                bottom: '-8px',
                zIndex: 1,
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            />

            {/* The actual sticker image */}
            <div className="relative z-10 p-0.5">
              <Image
                src={stickerSrc}
                alt="Sticker"
                width={stickerSize.width}
                height={stickerSize.height}
                className="object-contain"
                unoptimized={true}
                onError={() => {
                  debug.error(`Failed to load sticker image: ${stickerSrc}`);
                  onError && onError();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(VideoWithSticker);