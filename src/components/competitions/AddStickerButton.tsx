"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StickerPosition } from "@prisma/client";
import { Sticker } from "lucide-react";

interface AddStickerButtonProps {
  competitionId: string;
  postId?: string;
  disabled?: boolean;
  onStickerAdded?: () => void;
}

export default function AddStickerButton({
  competitionId,
  postId,
  disabled = false,
  onStickerAdded
}: AddStickerButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableStickers, setAvailableStickers] = useState<Array<{
    id: string;
    name: string;
    imageUrl: string;
    position: StickerPosition;
  }>>([]);

  // Load available stickers when dialog opens
  const loadStickers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/competitions/${competitionId}/stickers`);
      
      if (!response.ok) {
        throw new Error("Failed to load stickers");
      }
      
      const data = await response.json();
      setAvailableStickers(data.stickers || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available stickers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply sticker to post
  const applySticker = async (stickerId: string) => {
    if (!postId) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/competitions/${competitionId}/posts/${postId}/apply-sticker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stickerId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to apply sticker");
      }
      
      toast({
        title: "Success",
        description: "Sticker applied to your post",
      });
      
      setIsOpen(false);
      
      // Notify parent component
      if (onStickerAdded) {
        onStickerAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply sticker to post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        loadStickers();
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled}
          className="bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 hover:border-orange-300 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
        >
          <Sticker className="h-4 w-4 mr-2" />
          Add Sticker
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Sticker to Post</DialogTitle>
          <DialogDescription>
            Choose a sticker to add to your competition post
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : availableStickers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stickers available for this competition
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {availableStickers.map((sticker) => (
                <div 
                  key={sticker.id} 
                  className="flex flex-col items-center p-3 border border-border rounded-lg hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                  onClick={() => applySticker(sticker.id)}
                >
                  <div className="relative h-20 w-20 mb-2">
                    <img 
                      src={sticker.imageUrl} 
                      alt={sticker.name}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="text-sm font-medium text-center">{sticker.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {sticker.position.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
