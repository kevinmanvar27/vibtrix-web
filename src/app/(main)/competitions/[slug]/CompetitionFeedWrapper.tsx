"use client";

import { CompetitionFeedStickersProvider } from "@/hooks/use-competition-feed-stickers";
import CompetitionFeed from "./CompetitionFeed";
import { useEffect } from "react";
import debug from "@/lib/debug";

interface CompetitionFeedWrapperProps {
  competitionId: string;
}

export default function CompetitionFeedWrapper({ competitionId }: CompetitionFeedWrapperProps) {
  // Log when the wrapper is mounted
  useEffect(() => {
    debug.log(`CompetitionFeedWrapper mounted for competition: ${competitionId}`);

    // Check if the competition has feed stickers enabled
    const checkFeedStickersEnabled = async () => {
      try {
        const response = await fetch(`/api/competitions/${competitionId}/feed-stickers-setting`);
        const data = await response.json();
        debug.log(`Competition ${competitionId} feed stickers enabled: ${data.showFeedStickers}`);
      } catch (error) {
        debug.error(`Error checking feed stickers setting for competition ${competitionId}:`, error);
      }
    };

    checkFeedStickersEnabled();

    return () => {
      debug.log(`CompetitionFeedWrapper unmounted for competition: ${competitionId}`);
    };
  }, [competitionId]);

  return (
    <CompetitionFeedStickersProvider competitionId={competitionId}>
      <CompetitionFeed competitionId={competitionId} />
    </CompetitionFeedStickersProvider>
  );
}
