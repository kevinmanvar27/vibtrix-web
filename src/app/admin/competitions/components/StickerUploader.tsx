"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StickerPosition } from "@prisma/client";
import { useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import DirectStickerUploader from "@/components/admin/DirectStickerUploader";

import debug from "@/lib/debug";

/**
 * Props for the StickerUploader component
 */
interface StickerUploaderProps {
  /** Callback function to execute when a sticker is successfully created */
  onStickerCreated: () => void;
  /** List of positions that are already used and should be disabled */
  disabledPositions: StickerPosition[];
  /** Whether this is a default sticker (true) or optional sticker (false) */
  isDefault: boolean;
}

/**
 * Component for uploading competition stickers
 * Allows admins to create new stickers with specific positions
 */
export default function StickerUploader({
  onStickerCreated,
  disabledPositions,
  isDefault
}: StickerUploaderProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [position, setPosition] = useState<StickerPosition | "">("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
   * Handles the submission of the sticker creation form
   * Validates inputs and sends request to create a new sticker
   */
  const handleSubmit = async () => {
    if (!name || !position || !imageUrl) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields and upload an image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          imageUrl,
          position,
          isDefault,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create sticker");
      }

      toast({
        title: "Sticker created",
        description: "The sticker has been created successfully.",
      });

      // Reset form
      setName("");
      setPosition("");
      setImageUrl("");
      setOpen(false);

      // Notify parent component
      onStickerCreated();
    } catch (error) {
      // Log error and show toast notification
      toast({
        title: "Error",
        description: "Failed to create sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {isDefault ? "Upload Default Sticker" : "Upload Optional Sticker"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isDefault ? "Upload Default Sticker" : "Upload Optional Sticker"}
          </DialogTitle>
          <DialogDescription>
            Upload a sticker image and select its position.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Select
              value={position}
              onValueChange={(value) => setPosition(value as StickerPosition)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(StickerPosition).map((pos) => (
                  <SelectItem
                    key={pos}
                    value={pos}
                    disabled={disabledPositions.includes(pos)}
                  >
                    {positionLabels[pos]}
                    {disabledPositions.includes(pos) && " (Already used)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Image</Label>
            <div className="col-span-3">
              {imageUrl ? (
                <div className="relative h-32 w-32 mx-auto">
                  <Image
                    src={imageUrl}
                    alt={name || "Sticker preview"}
                    fill
                    className="object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={() => setImageUrl("")}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <DirectStickerUploader
                  onUploadComplete={(url) => {
                    debug.log('Sticker uploaded successfully:', url);
                    setImageUrl(url);
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Sticker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
