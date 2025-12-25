"use client";

import { ReactNode, useState, useEffect } from "react";
import { FeedStickersSettingProvider } from "@/hooks/use-feed-stickers-setting";
import { StickeredMediaProvider } from "@/hooks/use-stickered-media-setting";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import debug from "@/lib/debug";

interface CompetitionFeedSettingsClientWrapperProps {
  children: ReactNode;
  competitionId: string;
  showFeedStickers: boolean;
  showStickeredMedia: boolean;
}

export default function CompetitionFeedSettingsClientWrapper({
  children,
  competitionId,
  showFeedStickers,
  showStickeredMedia
}: CompetitionFeedSettingsClientWrapperProps) {
  // Store the current state of showFeedStickers and showStickeredMedia
  // Allow both to be disabled
  const [currentShowFeedStickers, setCurrentShowFeedStickers] = useState(showFeedStickers);
  const [currentShowStickeredMedia, setCurrentShowStickeredMedia] = useState(showStickeredMedia);

  // Create a client - use useState to ensure it's only created once
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  // Log initial values
  useEffect(() => {
    debug.log("CompetitionFeedSettingsClientWrapper: Initial values", {
      competitionId,
      showFeedStickers,
      showStickeredMedia
    });
    // Allow both settings to be disabled
  }, [competitionId, showFeedStickers, showStickeredMedia]);

  // Create a wrapper component that will re-render when settings change
  const ChildrenWrapper = ({ children }: { children: ReactNode }) => {
    debug.log("CompetitionFeedSettingsClientWrapper: Rendering with settings", {
      currentShowFeedStickers,
      currentShowStickeredMedia
    });

    // This will force a re-render of the children when the settings change
    useEffect(() => {
      debug.log("CompetitionFeedSettingsClientWrapper: Settings changed", {
        currentShowFeedStickers,
        currentShowStickeredMedia
      });
    }, [currentShowFeedStickers, currentShowStickeredMedia]);

    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <StickeredMediaProvider
        initialValue={showStickeredMedia}
        onValueChange={setCurrentShowStickeredMedia}
      >
        <FeedStickersSettingProvider
          initialValue={showFeedStickers}
          onValueChange={setCurrentShowFeedStickers}
        >
          <ChildrenWrapper>
            {children}
          </ChildrenWrapper>
        </FeedStickersSettingProvider>
      </StickeredMediaProvider>
    </QueryClientProvider>
  );
}
