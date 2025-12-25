"use client";

import { ReactNode, useState, useEffect } from "react";
import { FeedStickersSettingProvider } from "@/hooks/use-feed-stickers-setting";
import { StickeredMediaProvider } from "@/hooks/use-stickered-media-setting";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import debug from "@/lib/debug";

interface FeedSettingsClientWrapperProps {
  children: ReactNode;
  showFeedStickers: boolean;
  showStickeredMedia: boolean;
}

export default function FeedSettingsClientWrapper({
  children,
  showFeedStickers,
  showStickeredMedia
}: FeedSettingsClientWrapperProps) {
  // Store the current state of showFeedStickers
  const [currentShowFeedStickers, setCurrentShowFeedStickers] = useState(showFeedStickers);

  // Create a client - use useState to ensure it's only created once
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Monitor changes to the feed stickers setting
  useEffect(() => {
    debug.log("FeedSettingsClientWrapper: showFeedStickers changed", {
      showFeedStickers,
      currentShowFeedStickers
    });

    // If the value has changed, update our local state
    if (showFeedStickers !== currentShowFeedStickers) {
      setCurrentShowFeedStickers(showFeedStickers);
    }
  }, [showFeedStickers, currentShowFeedStickers]);

  // Create a custom handler for the FeedStickersSettingProvider
  const handleFeedStickersChange = (value: boolean) => {
    debug.log("FeedSettingsClientWrapper: handleFeedStickersChange called with value:", value);
    // Update our local state without refreshing the page
    setCurrentShowFeedStickers(value);
  };

  // Create a wrapper component that will re-render when currentShowFeedStickers changes
  const ChildrenWrapper = ({ children }: { children: ReactNode }) => {
    debug.log("ChildrenWrapper rendering with currentShowFeedStickers:", currentShowFeedStickers);

    // This will force a re-render of the children when the feed stickers setting changes
    useEffect(() => {
      debug.log("ChildrenWrapper effect running with currentShowFeedStickers:", currentShowFeedStickers);
    }, [currentShowFeedStickers]);

    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <StickeredMediaProvider initialValue={showStickeredMedia}>
        <FeedStickersSettingProvider
          initialValue={showFeedStickers}
          onValueChange={handleFeedStickersChange}
        >
          <ChildrenWrapper>
            {children}
          </ChildrenWrapper>
        </FeedStickersSettingProvider>
      </StickeredMediaProvider>
    </QueryClientProvider>
  );
}
