"use client";

import { Share2, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import ShareDialog from "./ShareDialog";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RequireAuth from "@/components/RequireAuth";
import { useGuestSession } from "@/components/GuestSessionProvider";
import { useSession } from "@/app/(main)/SessionProvider";

import debug from "@/lib/debug";

interface ShareButtonProps {
  postId: string;
  className?: string;
}

export default function ShareButton({ postId, className }: ShareButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const { sharingEnabled } = useFeatureSettings();

  // Get session information
  const { isLoggedIn } = useSession();
  const isGuest = !isLoggedIn;

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Track share in the database
  const trackShare = async () => {
    try {
      await apiClient.post(`/api/posts/${postId}/shares`);
    } catch (error) {
      debug.error("Failed to track share:", error);
      // Don't show error to user, just log it
    }
  };

  // Function to handle quick copy to clipboard without opening dialog
  const handleQuickShare = async (e: React.MouseEvent) => {
    // If shift key is pressed during click, copy link directly without opening dialog
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const postUrl = `${baseUrl}/posts/${postId}`;

      try {
        await navigator.clipboard.writeText(postUrl);
        setIsCopied(true);

        // Track the share
        await trackShare();

        toast({
          title: "Link copied!",
          description: "Post link has been copied to clipboard",
        });
      } catch (error) {
        debug.error("Failed to copy:", error);
        toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy the link to clipboard",
        });
      }
      return;
    }

    // Normal click opens the dialog
    setIsDialogOpen(true);
  };

  if (!sharingEnabled) {
    return null;
  }

  // The button content
  const buttonContent = (
    <>
      {isCopied ? (
        <Check className="size-5 text-green-500 animate-in fade-in-0 zoom-in-95 duration-300" />
      ) : (
        <Share2 className="size-5 group-hover:scale-110 transition-transform duration-200" />
      )}
      <span className="text-sm font-medium hidden sm:inline">
        {isCopied ? "Copied!" : "Share"}
      </span>
    </>
  );

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <RequireAuth>
              <button
                onClick={handleQuickShare}
                className={cn(
                  "flex items-center gap-2 group relative hover:text-primary transition-colors",
                  "relative overflow-hidden",
                  className
                )}
                aria-label="Share post"
              >
                {buttonContent}
              </button>
            </RequireAuth>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>Click to share, Shift+Click to copy link</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ShareDialog
        postId={postId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
