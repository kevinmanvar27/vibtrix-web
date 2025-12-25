"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { toggleCompetitionMediaDisplay, toggleCompetitionFeedStickers } from "../actions";
import { Sticker, CheckCircle2, XCircle } from "lucide-react";
import { useStickeredMediaSetting } from "@/hooks/use-stickered-media-setting";
import { useFeedStickersSetting } from "@/hooks/use-feed-stickers-setting";
import debug from "@/lib/debug";

interface CompetitionFeedStickersToggleFormProps {
  competitionId: string;
  showFeedStickers: boolean;
}

export function CompetitionFeedStickersToggleForm({
  competitionId,
  showFeedStickers
}: CompetitionFeedStickersToggleFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentValue, setCurrentValue] = useState(showFeedStickers);
  const { setShowFeedStickers } = useFeedStickersSetting();
  const { setShowStickeredMedia } = useStickeredMediaSetting();

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      // Calculate the new value before making the API call
      const newValue = !currentValue;

      debug.log(`Attempting to toggle competition feed stickers display to: ${newValue ? "enabled" : "disabled"}`);

      // If enabling feed stickers, disable stickered media
      if (newValue === true) {
        debug.log("Disabling stickered media because feed stickers are being enabled");
        await toggleCompetitionMediaDisplay(competitionId, false);
        setShowStickeredMedia(false);
      }
      // Allow both settings to be disabled

      // Call the server action to update the setting
      const result = await toggleCompetitionFeedStickers(competitionId, newValue);

      if (result) {
        // Update the local state
        setCurrentValue(newValue);

        // Update the global context to trigger UI updates across the app
        setShowFeedStickers(newValue);

        debug.log(`Successfully toggled competition feed stickers display to: ${newValue ? "enabled" : "disabled"}`);

        // Show appropriate toast message
        if (newValue) {
          toast({
            title: "Feed stickers enabled",
            description: "Feed stickers are now enabled for this competition. Stickered media has been disabled."
          });
        } else {
          toast({
            title: "Feed stickers disabled",
            description: "Feed stickers are now disabled for this competition."
          });
        }
      } else {
        throw new Error("Failed to update setting on the server");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update setting"
      });
      debug.error("Error toggling competition feed stickers display:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sticker className="h-5 w-5 text-primary" />
          Feed Stickers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Enable Feed Stickers</div>
            <div className="text-sm text-muted-foreground">
              Apply stickers to media in the competition feed
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
              aria-label="Toggle feed stickers"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
