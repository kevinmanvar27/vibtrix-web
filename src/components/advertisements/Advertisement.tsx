"use client";

import { useState, useEffect } from "react";
import { MediaType } from "@prisma/client";
import Image from "next/image";
import CustomVideoPlayer from "../ui/CustomVideoPlayer";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

import debug from "@/lib/debug";

interface AdvertisementProps {
  id: string;
  title: string;
  mediaUrl?: string;
  mediaType: MediaType;
  skipDuration: number;
  url?: string;
}

export default function Advertisement({
  id,
  title,
  mediaUrl,
  mediaType,
  skipDuration,
  url,
}: AdvertisementProps) {
  // Use a fallback URL if mediaUrl is undefined
  const safeMediaUrl = mediaUrl || "/images/fallback-ad.svg";
  debug.log("Rendering advertisement:", { id, title, mediaUrl: safeMediaUrl, mediaType });
  const [timeRemaining, setTimeRemaining] = useState(skipDuration);
  const [canSkip, setCanSkip] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setCanSkip(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleSkip = () => {
    setIsVisible(false);
  };

  const handleAdClick = () => {
    if (url) {
      // Open the URL in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative rounded-2xl bg-card shadow-md border border-border/30 overflow-hidden">
      {/* Countdown or X button in top-right */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm">
        {canSkip ? (
          <span
            className="flex items-center cursor-pointer"
            onClick={handleSkip}
          >
            <X className="h-3 w-3" />
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {timeRemaining}
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative",
          url ? "cursor-pointer" : ""
        )}
        onClick={url ? handleAdClick : undefined}
      >
        {!safeMediaUrl ? (
          <div className="flex items-center justify-center w-full aspect-video bg-muted rounded-md">
            <p className="text-muted-foreground">Advertisement media not available</p>
          </div>
        ) : mediaType === "IMAGE" ? (
          <div className="relative w-full aspect-video">
            <Image
              src={safeMediaUrl}
              alt={title}
              fill
              className="object-contain"
              priority
              onError={(e) => {
                debug.error(`Error loading advertisement image: ${safeMediaUrl}`);
                // Replace with a fallback image
                e.currentTarget.src = "/images/fallback-ad.svg";
              }}
            />
          </div>
        ) : (
          <div className="w-full aspect-video">
            <CustomVideoPlayer
              src={safeMediaUrl}
              poster={undefined}
              className={cn(
                "w-full",
                mediaType === "VIDEO" ? "aspect-video" : "h-auto"
              )}
              autoPlay
              muted
              loop
            />
          </div>
        )}

        {/* Advertisement text at bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="text-xs text-white bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
            Advertisement
          </span>
        </div>
      </div>
    </div>
  );
}
