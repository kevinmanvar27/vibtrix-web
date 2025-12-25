"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { toggleFeedStickersDisplay, toggleFeedMediaDisplay } from "../actions";
import { Sticker, CheckCircle2, XCircle } from "lucide-react";
import { useFeedStickersSetting } from "@/hooks/use-feed-stickers-setting";
import { useStickeredMediaSetting } from "@/hooks/use-stickered-media-setting";
import debug from "@/lib/debug";

interface FeedStickersToggleFormProps {
  showFeedStickers: boolean;
}

export function FeedStickersToggleForm({ showFeedStickers }: FeedStickersToggleFormProps) {
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

      debug.log(`Attempting to toggle feed stickers display to: ${newValue ? "enabled" : "disabled"}`);

      // If enabling feed stickers, disable stickered media
      if (newValue === true) {
        debug.log("Disabling stickered media because feed stickers are being enabled");
        await toggleFeedMediaDisplay(false);
        setShowStickeredMedia(false);
      }

      // Call the server action to update the setting
      const result = await toggleFeedStickersDisplay(newValue);

      debug.log(`Server action result:`, result);

      if (result.success) {
        // Update the local state
        setCurrentValue(newValue);

        // Update the global context to trigger UI updates across the app
        setShowFeedStickers(newValue);

        debug.log(`Successfully toggled feed stickers display to: ${newValue ? "enabled" : "disabled"}`);

        // Show appropriate toast message
        if (newValue) {
          toast({
            title: "Feed stickers enabled",
            description: "Feed stickers are now enabled. Stickered media has been disabled."
          });
        } else {
          toast({
            title: "Feed stickers disabled",
            description: "Feed stickers are now disabled."
          });
        }

        // Log the change but don't reload the page
        debug.log(`Feed stickers display toggled to: ${newValue ? "enabled" : "disabled"}`)
      } else {
        throw new Error("Failed to update setting on the server");
      }
    } catch (error: any) {
      debug.error("Error toggling feed stickers display:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update feed stickers display setting. Please try again.",
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
          <Sticker className="h-5 w-5 text-primary" />
          Feed Stickers Display
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-row items-start justify-between rounded-lg bg-muted/50 p-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-medium">Show Feed Stickers</h3>
              <p className="text-sm text-muted-foreground">
                When enabled, stickers will be displayed on media in the feed.
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
                You can enable either this setting OR the Stickered Media setting, but not both at the same time. When disabled, media will be shown without stickers.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
