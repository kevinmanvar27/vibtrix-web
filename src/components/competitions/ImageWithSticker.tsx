'use client';

import { useId, memo, useRef, useEffect, useState } from 'react';
import { StickerPosition } from '@prisma/client';
import Image from 'next/image';
import CustomImage from '@/components/ui/CustomImage';
import debug from '@/lib/debug';

interface ImageWithStickerProps {
  imageSrc: string;
  stickerSrc?: string;
  stickerPosition?: StickerPosition;
  className?: string;
  onError?: () => void;
  onDoubleClick?: () => void;
  urlHigh?: string;
  urlMedium?: string;
  urlLow?: string;
  urlThumbnail?: string;
  adaptiveQuality?: boolean;
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
}

function ImageWithSticker({
  imageSrc,
  stickerSrc,
  stickerPosition = 'BOTTOM_RIGHT',
  className = '',
  onError,
  onDoubleClick,
  urlHigh,
  urlMedium,
  urlLow,
  urlThumbnail,
  adaptiveQuality = true,
  alt = 'Image',
  fill = true,
  priority = false,
  loading = 'lazy',
}: ImageWithStickerProps) {
  // Generate a unique ID for this component instance
  const instanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickerStyles, setStickerStyles] = useState<React.CSSProperties>({});
  const [stickerSize, setStickerSize] = useState({ width: 100, height: 100 });

  // Calculate sticker position and size based on container and position prop
  useEffect(() => {
    if (!stickerSrc || !containerRef.current) {
      return;
    }

    debug.log('ImageWithSticker: Calculating sticker styles', {
      stickerSrc,
      position: stickerPosition
    });

    // Function to calculate sticker position
    const calculateStickerStyles = () => {
      const containerElement = containerRef.current;
      if (!containerElement) return;

      // Get the container dimensions
      const containerRect = containerElement.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate sticker size (20% of container width for consistency with other sticker implementations)
      const stickerWidth = Math.round(containerWidth * 0.20);
      const stickerHeight = stickerWidth;

      setStickerSize({
        width: stickerWidth,
        height: stickerHeight
      });

      // Calculate padding (3% of container width for consistency with other sticker implementations)
      const padding = Math.round(containerWidth * 0.03);

      // Calculate position based on stickerPosition prop
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
          bottom = padding;
          right = padding;
          break;
        case 'CENTER':
          top = '50%';
          left = '50%';
          break;
        default:
          // Default to BOTTOM_RIGHT
          bottom = padding;
          right = padding;
          break;
      }

      // Set styles for the sticker container
      const styles: React.CSSProperties = {
        position: 'absolute',
        zIndex: 10, // Consistent z-index across all sticker implementations
      };

      if (top !== undefined) styles.top = top;
      if (right !== undefined) styles.right = right;
      if (bottom !== undefined) styles.bottom = bottom;
      if (left !== undefined) styles.left = left;

      // Add transform for CENTER position
      if (stickerPosition === 'CENTER') {
        styles.transform = 'translate(-50%, -50%)';
      }

      debug.log('ImageWithSticker: Calculated styles', {
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
  }, [stickerSrc, stickerPosition]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      data-image-id={instanceId}
      onClick={onDoubleClick}
    >
      {/* Main image */}
      <CustomImage
        src={imageSrc}
        alt={alt}
        fill={fill}
        className="object-contain"
        priority={priority}
        loading={loading}
        urlHigh={urlHigh}
        urlMedium={urlMedium}
        urlLow={urlLow}
        urlThumbnail={urlThumbnail}
        adaptiveQuality={adaptiveQuality}
        onDoubleClick={onDoubleClick}
        style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto', height: 'auto' }}
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
                onError={(e) => {
                  debug.error(`Failed to load sticker image:`, e);
                  if (onError) onError();
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
export default memo(ImageWithSticker);