"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackType?: "avatar" | "image" | "custom";
  fallbackText?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  fallbackType = "image",
  fallbackText,
  priority = false,
  fill = false,
  sizes,
  quality,
  onLoad,
  onError,
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src or error occurred, show fallback
  if (!src || imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          className,
        )}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : undefined
        }
      >
        {fallbackType === "avatar" ? (
          <AvatarFallbackSVG text={fallbackText} />
        ) : fallbackType === "custom" && fallbackText ? (
          <span className="text-sm font-medium text-muted-foreground">
            {fallbackText}
          </span>
        ) : (
          <ImageFallbackSVG />
        )}
      </div>
    );
  }

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const imageProps = {
    src,
    alt,
    className: cn(className, isLoading && "animate-pulse"),
    onError: handleError,
    onLoad: handleLoad,
    priority,
    quality,
    ...(fill
      ? { fill: true, sizes }
      : { width: width || 100, height: height || 100 }),
  };

  return <Image {...imageProps} />;
}

// Avatar fallback SVG component
function AvatarFallbackSVG({ text }: { text?: string }) {
  const initial = text?.[0]?.toUpperCase() || "U";

  return (
    <svg
      className="h-full w-full"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="50" fill="currentColor" opacity="0.1" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="40"
        fontWeight="600"
        fill="currentColor"
        opacity="0.6"
      >
        {initial}
      </text>
    </svg>
  );
}

// Generic image fallback SVG
function ImageFallbackSVG() {
  return (
    <svg
      className="h-1/2 w-1/2 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
