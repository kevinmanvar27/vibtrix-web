"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { toggleCompetitionMediaDisplay, toggleCompetitionFeedStickers } from "../actions";
import { MonitorPlay, Image, CheckCircle2, XCircle } from "lucide-react";
import { useStickeredMediaSetting } from "@/hooks/use-stickered-media-setting";
import { useFeedStickersSetting } from "@/hooks/use-feed-stickers-setting";
import debug from "@/lib/debug";

interface CompetitionFeedSettingsFormProps {
  competitionId: string;
  showStickeredMedia: boolean;
}

export function CompetitionFeedSettingsForm({ competitionId, showStickeredMedia }: CompetitionFeedSettingsFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentValue, setCurrentValue] = useState(showStickeredMedia);
  const { setShowStickeredMedia } = useStickeredMediaSetting();
  const { setShowFeedStickers } = useFeedStickersSetting();

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      const newValue = !currentValue;

      // If enabling stickered media, disable feed stickers
      if (newValue === true) {
        debug.log("Disabling feed stickers because stickered media is being enabled");
        await toggleCompetitionFeedStickers(competitionId, false);
        setShowFeedStickers(false);
      }
      // Allow both settings to be disabled

      // Update stickered media setting
      await toggleCompetitionMediaDisplay(competitionId, newValue);
      setCurrentValue(newValue);

      // Update the context to trigger UI updates across the app
      setShowStickeredMedia(newValue);

      debug.log(`Toggled competition feed media display to: ${newValue ? "stickered" : "original"}`);

      // Show appropriate toast message
      if (newValue) {
        toast({
          title: "Stickered media enabled",
          description: "The competition feed will now display stickered media. Feed stickers have been disabled."
        });
      } else {
        toast({
          title: "Original media enabled",
          description: "The competition feed will now display original media without stickers."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update setting"
      });
      debug.error("Error toggling competition feed media display:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MonitorPlay className="h-5 w-5 text-primary" />
          Media Display
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Stickered Media</div>
            <div className="text-sm text-muted-foreground">
              Show stickered versions of media in the competition feed
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentValue ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
            <Switch
              checked={currentValue}
              onCheckedChange={handleToggle}
              disabled={isProcessing}
              aria-label="Toggle stickered media display"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
