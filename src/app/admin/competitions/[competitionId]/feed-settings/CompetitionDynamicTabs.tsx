'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Sticker, Image } from "lucide-react";
import { useFeedStickersSetting } from "@/hooks/use-feed-stickers-setting";
import { useStickeredMediaSetting } from "@/hooks/use-stickered-media-setting";
import { CompetitionFeedSettingsForm } from "../../components/CompetitionFeedSettingsForm";
import { CompetitionFeedStickersToggleForm } from "../../components/CompetitionFeedStickersToggleForm";
import { CompetitionDefaultFeedStickerForm } from "../../components/CompetitionDefaultFeedStickerForm";
import { CompetitionFeedStickersForm } from "../../components/CompetitionFeedStickersForm";
import debug from "@/lib/debug";

interface CompetitionDynamicTabsProps {
  competitionId: string;
  initialShowFeedStickers: boolean;
  initialShowStickeredMedia: boolean;
  defaultSticker: any | null;
  feedStickers: any[];
}

export default function CompetitionDynamicTabs({
  competitionId,
  initialShowFeedStickers,
  initialShowStickeredMedia,
  defaultSticker,
  feedStickers
}: CompetitionDynamicTabsProps) {
  const [activeTab, setActiveTab] = useState('display');
  const { showFeedStickers, setShowFeedStickers } = useFeedStickersSetting();
  const { showStickeredMedia, setShowStickeredMedia } = useStickeredMediaSetting();

  // Reset to display tab if feed stickers are disabled and we're on a sticker tab
  useEffect(() => {
    debug.log("CompetitionDynamicTabs: showFeedStickers changed", {
      showFeedStickers,
      showStickeredMedia,
      activeTab
    });

    if (!showFeedStickers && (activeTab === 'default' || activeTab === 'stickers')) {
      debug.log("CompetitionDynamicTabs: Resetting to display tab");
      setActiveTab('display');
    }
  }, [showFeedStickers, showStickeredMedia, activeTab]);

  // Enforce mutual exclusivity between settings
  useEffect(() => {
    // If both settings are enabled, disable stickered media
    if (showFeedStickers && showStickeredMedia) {
      debug.log("CompetitionDynamicTabs: Both settings enabled, disabling stickered media");
      setShowStickeredMedia(false);
    }
    // Allow both settings to be disabled
  }, [showFeedStickers, showStickeredMedia, setShowStickeredMedia]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className={`grid ${showFeedStickers ? 'grid-cols-3' : 'grid-cols-1'} w-full max-w-md mb-4`}>
        <TabsTrigger value="display" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Display Settings</span>
        </TabsTrigger>

        {showFeedStickers && (
          <>
            <TabsTrigger value="default" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span>Default Sticker</span>
            </TabsTrigger>
            <TabsTrigger value="stickers" className="flex items-center gap-2">
              <Sticker className="h-4 w-4" />
              <span>Feed Stickers</span>
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="display" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <CompetitionFeedSettingsForm
            competitionId={competitionId}
            showStickeredMedia={initialShowStickeredMedia}
          />
          <CompetitionFeedStickersToggleForm
            competitionId={competitionId}
            showFeedStickers={initialShowFeedStickers}
          />
        </div>
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <p className="text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            These settings affect how media appears in the feed for this competition only. Stickered versions are always generated on the backend regardless of these settings.
          </p>
        </div>
      </TabsContent>

      {showFeedStickers && (
        <>
          <TabsContent value="default">
            <CompetitionDefaultFeedStickerForm
              competitionId={competitionId}
              defaultSticker={defaultSticker}
            />
          </TabsContent>

          <TabsContent value="stickers">
            <CompetitionFeedStickersForm
              competitionId={competitionId}
              feedStickers={feedStickers}
            />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
