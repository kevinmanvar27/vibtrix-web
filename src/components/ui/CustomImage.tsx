'use client';

import Image, { ImageProps } from 'next/image';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

import debug from "@/lib/debug";

interface CustomImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  urlHigh?: string;
  urlMedium?: string;
  urlLow?: string;
  urlThumbnail?: string;
  posterUrl?: string;
  adaptiveQuality?: boolean;
}

export default function CustomImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  urlHigh,
  urlMedium,
  urlLow,
  urlThumbnail,
  posterUrl,
  adaptiveQuality = true,
  ...props
}: CustomImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  // Track connection info for adaptive quality
  const [, setConnectionType] = useState<string>('unknown');
  const [, setEffectiveType] = useState<string>('unknown');
  const [selectedQuality, setSelectedQuality] = useState<string>('original');

  // Determine if this is a local file - memoized to avoid recalculation
  const isLocalFile = useMemo(() => {
    return typeof src === 'string' && (
      src?.startsWith('/uploads/') ||
      src?.startsWith('blob:') ||
      src?.startsWith('data:')
    );
  }, [src]);

  // Select appropriate quality based on connection and device - memoized with useCallback
  const selectAppropriateQuality = useCallback(() => {
    if (!adaptiveQuality) {
      setSelectedQuality('original');
      return;
    }

    // Get connection info if available
    let effectiveConnectionType = 'unknown';
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      effectiveConnectionType = (navigator as any).connection?.effectiveType || 'unknown';
    }

    // Get screen width
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    // Determine quality based on connection and screen size
    if (effectiveConnectionType === 'slow-2g' || effectiveConnectionType === '2g') {
      // Very slow connection - use lowest quality
      setSelectedQuality(urlThumbnail ? 'thumbnail' : (urlLow ? 'low' : 'original'));
    } else if (effectiveConnectionType === '3g') {
      // Medium connection - use medium quality
      setSelectedQuality(urlLow ? 'low' : 'original');
    } else if (screenWidth <= 768) {
      // Mobile device - use medium quality
      setSelectedQuality(urlMedium ? 'medium' : 'original');
    } else {
      // Good connection and larger screen - use high quality
      setSelectedQuality(urlHigh ? 'high' : 'original');
    }
  }, [adaptiveQuality, urlHigh, urlMedium, urlLow, urlThumbnail]);

  // Detect network connection quality
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // Check if the Network Information API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      // Set initial values
      setConnectionType(connection.type || 'unknown');
      setEffectiveType(connection.effectiveType || 'unknown');

      // Listen for changes
      const updateConnectionInfo = () => {
        setConnectionType(connection?.type || 'unknown');
        setEffectiveType(connection?.effectiveType || 'unknown');
        selectAppropriateQuality();
      };

      if (connection && typeof connection.addEventListener === 'function') {
        connection.addEventListener('change', updateConnectionInfo);
      } else if (connection) {
        connection.onchange = updateConnectionInfo;
      }

      // Initial quality selection
      selectAppropriateQuality();

      return () => {
        if (connection && typeof connection.removeEventListener === 'function') {
          connection.removeEventListener('change', updateConnectionInfo);
        } else if (connection) {
          connection.onchange = null;
        }
      };
    }
  }, [selectAppropriateQuality]);

  // Reset states when src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);

    // Select appropriate quality
    selectAppropriateQuality();

    // Set the image source based on selected quality
    if (selectedQuality === 'high' && urlHigh) {
      setImgSrc(urlHigh);
    } else if (selectedQuality === 'medium' && urlMedium) {
      setImgSrc(urlMedium);
    } else if (selectedQuality === 'low' && urlLow) {
      setImgSrc(urlLow);
    } else if (selectedQuality === 'thumbnail' && urlThumbnail) {
      setImgSrc(urlThumbnail);
    } else {
      setImgSrc(src as string);
    }
  }, [src, urlHigh, urlMedium, urlLow, urlThumbnail, selectedQuality, selectAppropriateQuality]);

  // Safety check to ensure we always have a valid image source
  useEffect(() => {
    if (!imgSrc && src) {
      setImgSrc(src as string);
    }
  }, [imgSrc, src]);



  // Handle image loading error
  const handleError = () => {
    // debug.error(`CustomImage: Failed to load image: ${imgSrc}`);
    setError(true);
  };

  // Handle image load success
  const handleLoad = () => {
    // debug.log(`CustomImage: Successfully loaded image: ${imgSrc}`);
    setLoaded(true);
  };

  // If the image source is null or empty, show loading state
  if (!imgSrc) {
    return (
      <div className="relative h-full w-full flex items-center justify-center bg-muted/20">
        <div className="animate-pulse rounded-full h-12 w-12 bg-muted"></div>
      </div>
    );
  }

  // If there's an error, show fallback image
  if (error) {
    return (
      <div className="relative h-full w-full">
        <img
          src={fallbackSrc}
          alt={alt as string}
          className={cn("h-full w-full object-contain", props.className)}
        />
      </div>
    );
  }

  // For local files, use a regular img tag instead of Next.js Image
  if (isLocalFile || (typeof imgSrc === 'string' && (imgSrc?.startsWith('/uploads/') || imgSrc?.startsWith('blob:') || imgSrc?.startsWith('data:')))) {
    // Make sure the URL is absolute for local uploads
    let imageUrl = imgSrc;
    if (typeof imgSrc === 'string' && imgSrc.startsWith('/uploads/')) {
      // Add the base URL for local development
      if (typeof window !== 'undefined') {
        const baseUrl = window.location.origin;
        imageUrl = `${baseUrl}${imgSrc}`;
      }
    }

    return (
      <div className="relative w-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt={alt as string}
          className={cn("max-w-full object-contain screenshot-protected", props.className)}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            objectFit: 'contain',
            maxHeight: '100%',
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            margin: '0 auto',
            display: 'block',
            ...props.style,
          }}
          onContextMenu={(e) => e.preventDefault()}
          draggable="false"
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <div className="animate-pulse rounded-full h-12 w-12 bg-muted"></div>
          </div>
        )}
      </div>
    );
  }

  // For remote images, use Next.js Image component with optimizations
  return (
    <div className="relative w-full flex items-center justify-center">
      <div className="screenshot-protected w-full" onContextMenu={(e) => e.preventDefault()}>
        <Image
          src={imgSrc}
          alt={alt}
          {...props}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            objectFit: 'contain',
            maxHeight: '100%',
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            margin: '0 auto',
            display: 'block',
            ...props.style,
          }}
          sizes={props.sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"} // Responsive sizing
          priority={props.priority || false} // Add priority option
          loading={props.priority ? 'eager' : 'lazy'} // Use lazy loading when not priority
          quality={selectedQuality === 'high' ? 80 : selectedQuality === 'medium' ? 70 : 50} // Lower quality for better performance
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmMWYxZjEiLz48L3N2Zz4="
          unoptimized={false}
          draggable={false}
        />
      </div>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
          <div className="animate-pulse rounded-full h-8 w-8 bg-muted/30"></div>
        </div>
      )}
    </div>
  );
}
