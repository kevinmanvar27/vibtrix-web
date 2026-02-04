"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { toggleFeedMediaDisplay, toggleFeedStickersDisplay } from "../actions";
import { MonitorPlay, Image, CheckCircle2, XCircle } from "lucide-react";
import { useStickeredMediaSetting } from "@/hooks/use-stickered-media-setting";
import { useFeedStickersSetting } from "@/hooks/use-feed-stickers-setting";
import debug from "@/lib/debug";

interface FeedSettingsFormProps {
  showStickeredMedia: boolean;
}

export function FeedSettingsForm({ showStickeredMedia }: FeedSettingsFormProps) {
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
        await toggleFeedStickersDisplay(false);
        setShowFeedStickers(false);
      }

      // Update stickered media setting
      await toggleFeedMediaDisplay(newValue);
      setCurrentValue(newValue);

      // Update the context to trigger UI updates across the app
      setShowStickeredMedia(newValue);

      debug.log(`Toggled feed media display to: ${newValue ? "stickered" : "original"}`);

      // Show appropriate toast message
      if (newValue) {
        toast({
          title: "Stickered media enabled",
          description: "The feed will now display stickered media. Feed stickers have been disabled."
        });
      } else {
        toast({
          title: "Original media enabled",
          description: "The feed will now display original media without stickers."
        });
      }
    } catch (error: any) {
      debug.error("Error toggling feed media display:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update feed media display setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
      <div className={`h-1 w-full ${currentValue ? "bg-primary" : "bg-gray-200"}`}></div>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MonitorPlay className="h-5 w-5 text-primary" />
          Feed Media Display
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-row items-start justify-between rounded-lg bg-muted/50 p-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-pink-500" />
                <h3 className="text-base font-medium">Stickered Media</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, stickered versions of media will be shown in the feed.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 min-w-[80px]">
              {isProcessing ? (
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              ) : (
                <>
                  <Switch
                    checked={currentValue}
                    onCheckedChange={handleToggle}
                    disabled={isProcessing}
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {currentValue ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        <span className="text-primary">Enabled</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Disabled</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-3 border border-muted">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 min-w-[16px]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <p className="text-xs text-muted-foreground">
                When disabled, original media without stickers will be shown. Stickered versions are still generated on the backend.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
