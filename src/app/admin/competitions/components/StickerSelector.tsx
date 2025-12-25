"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StickerPosition } from "@prisma/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import StickerUploader from "./StickerUploader";

/**
 * Represents a sticker that can be applied to competition posts
 */
export interface Sticker {
  /** Unique identifier for the sticker */
  id: string;
  /** Display name of the sticker */
  name: string;
  /** URL to the sticker image */
  imageUrl: string;
  /** Position where the sticker should be placed */
  position: StickerPosition;
  /** Whether this is a default sticker (true) or optional sticker (false) */
  isDefault: boolean;
}

/**
 * Props for the StickerSelector component
 */
interface StickerSelectorProps {
  /** List of all available stickers */
  stickers: Sticker[];
  /** Currently selected default stickers with their positions */
  selectedDefaultStickers: { id: string; position: StickerPosition }[];
  /** Currently selected optional stickers with their positions */
  selectedOptionalStickers: { id: string; position: StickerPosition }[];
  /** Callback when a default sticker is selected or removed */
  onDefaultStickerChange: (position: StickerPosition, stickerId: string | null) => void;
  /** Callback when an optional sticker is selected or removed */
  onOptionalStickerChange: (position: StickerPosition, stickerId: string | null) => void;
  /** Callback when a new sticker is created */
  onStickerCreated: () => void;
}

/**
 * Component for selecting and managing stickers for competition posts
 * Allows selecting default and optional stickers for different positions
 */
export default function StickerSelector({
  stickers,
  selectedDefaultStickers,
  selectedOptionalStickers,
  onDefaultStickerChange,
  onOptionalStickerChange,
  onStickerCreated,
}: StickerSelectorProps) {
  const [availablePositions, setAvailablePositions] = useState<StickerPosition[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Update available positions whenever default stickers change or refresh trigger changes
   * A position is available if it doesn't have a default sticker assigned
   */
  useEffect(() => {
    const defaultPositions = selectedDefaultStickers.map(s => s.position);
    const allPositions = Object.values(StickerPosition);
    setAvailablePositions(allPositions.filter(p => !defaultPositions.includes(p)));
  }, [selectedDefaultStickers, refreshTrigger]);

  /**
   * Find a sticker by its ID
   * @param id The sticker ID to find
   * @returns The sticker object or undefined if not found
   */
  const getStickerById = (id: string) => stickers.find(s => s.id === id);

  /**
   * Get the default sticker assigned to a specific position
   * @param position The position to check
   * @returns The sticker object or null if no default sticker is assigned
   */
  const getDefaultStickerForPosition = (position: StickerPosition) => {
    const selected = selectedDefaultStickers.find(s => s.position === position);
    return selected ? getStickerById(selected.id) : null;
  };

  /**
   * Get all optional stickers assigned to a specific position
   * @param position The position to check
   * @returns Array of sticker objects assigned to this position
   */
  const getOptionalStickersForPosition = (position: StickerPosition) => {
    return selectedOptionalStickers
      .filter(s => s.position === position)
      .map(s => getStickerById(s.id))
      .filter(Boolean) as Sticker[];
  };

  /**
   * Human-readable labels for sticker positions
   * Maps enum values to display text
   */
  const positionLabels: Record<StickerPosition, string> = {
    TOP_LEFT: "Top Left",
    TOP_RIGHT: "Top Right",
    BOTTOM_LEFT: "Bottom Left",
    BOTTOM_RIGHT: "Bottom Right",
    CENTER: "Center",
  };

  /**
   * Handle sticker creation event
   * Refreshes the component and notifies parent
   */
  const handleStickerCreated = () => {
    // Trigger a refresh by incrementing the counter
    setRefreshTrigger(prev => prev + 1);
    // Notify parent component
    onStickerCreated();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-4">
        <StickerUploader
          onStickerCreated={handleStickerCreated}
          disabledPositions={selectedDefaultStickers.map(s => s.position)}
          isDefault={true}
        />
        <StickerUploader
          onStickerCreated={handleStickerCreated}
          disabledPositions={selectedDefaultStickers.map(s => s.position)}
          isDefault={false}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(StickerPosition).map(position => (
          <Card key={position}>
            <CardHeader>
              <CardTitle className="text-base">{positionLabels[position]}</CardTitle>
              <CardDescription>
                {availablePositions.includes(position)
                  ? "Select a default sticker or leave empty"
                  : "Default sticker selected"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default sticker selector */}
              <div>
                <h4 className="text-sm font-medium mb-2">Default Sticker</h4>
                <Select
                  value={selectedDefaultStickers.find(s => s.position === position)?.id || "none"}
                  onValueChange={(value) => {
                    // Update the default sticker for this position
                    onDefaultStickerChange(position, value === "none" ? null : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sticker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {stickers.map(sticker => (
                      <SelectItem key={sticker.id} value={sticker.id}>
                        {sticker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Preview of selected default sticker */}
                {getDefaultStickerForPosition(position) && (
                  <div className="mt-2 relative">
                    <div className="relative h-20 w-20 mx-auto">
                      <Image
                        src={getDefaultStickerForPosition(position)!.imageUrl}
                        alt={getDefaultStickerForPosition(position)!.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0"
                      onClick={() => onDefaultStickerChange(position, null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Optional stickers section - only shown if no default sticker is selected */}
              {availablePositions.includes(position) && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Optional Stickers</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    These stickers will be available for users to choose from
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {getOptionalStickersForPosition(position).map(sticker => (
                      <div key={sticker.id} className="relative">
                        <div className="relative h-12 w-12">
                          <Image
                            src={sticker.imageUrl}
                            alt={sticker.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground"
                          onClick={() => onOptionalStickerChange(position, sticker.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    <div className="h-12 w-12 flex items-center justify-center border rounded-md cursor-pointer hover:bg-accent"
                      onClick={() => {
                        // Find a sticker that's not already used in this position
                        const availableSticker = stickers.find(sticker =>
                          !getOptionalStickersForPosition(position).some(s => s.id === sticker.id)
                        );

                        if (availableSticker) {
                          // Auto-select an available sticker for this position
                          onOptionalStickerChange(position, availableSticker.id);
                        } else {
                          // No stickers available to select
                        }
                      }}
                    >
                      <span className="text-2xl">+</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
