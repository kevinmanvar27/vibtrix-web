"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { StickerPosition } from "@prisma/client";
import { Image, Loader2 } from "lucide-react";
import DirectStickerUploader from "@/components/admin/DirectStickerUploader";
import NextImage from "next/image";
import { Badge } from "@/components/ui/badge";
import debug from "@/lib/debug";

interface DefaultFeedSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  limit: number | null;
  isActive: boolean;
}

interface CompetitionDefaultFeedStickerFormProps {
  competitionId: string;
  defaultSticker: DefaultFeedSticker | null;
}

export function CompetitionDefaultFeedStickerForm({
  competitionId,
  defaultSticker: initialSticker
}: CompetitionDefaultFeedStickerFormProps) {
  const { toast } = useToast();
  const [sticker, setSticker] = useState<DefaultFeedSticker | null>(initialSticker);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [position, setPosition] = useState<StickerPosition | "">("");
  const [isActive, setIsActive] = useState(true);

  // Position labels for display
  const positionLabels: Record<StickerPosition, string> = {
    TOP_LEFT: "Top Left",
    TOP_RIGHT: "Top Right",
    BOTTOM_LEFT: "Bottom Left",
    BOTTOM_RIGHT: "Bottom Right",
    CENTER: "Center",
  };

  // Fetch default sticker on component mount
  useEffect(() => {
    if (initialSticker) {
      setSticker(initialSticker);
    } else {
      fetchDefaultSticker();
    }
  }, [initialSticker]);

  // Fetch default sticker from the API
  const fetchDefaultSticker = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/competitions/${competitionId}/default-sticker`);

      if (!response.ok) {
        if (response.status === 404) {
          // No default sticker found, that's okay
          setSticker(null);
          return;
        }
        throw new Error("Failed to fetch default competition feed sticker");
      }

      const data = await response.json();
      if (data.sticker) {
        setSticker(data.sticker);
        // Populate form fields if we're in edit mode
        if (isEditing) {
          setTitle(data.sticker.title);
          setImageUrl(data.sticker.imageUrl);
          setPosition(data.sticker.position);
          setIsActive(data.sticker.isActive);
        }
      } else {
        setSticker(null);
      }
    } catch (error) {
      debug.error("Error fetching default competition feed sticker:", error);
      toast({
        title: "Error",
        description: "Failed to load default feed sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    if (sticker) {
      setTitle(sticker.title);
      setImageUrl(sticker.imageUrl);
      setPosition(sticker.position);
      setIsActive(sticker.isActive);
    } else {
      setTitle("");
      setImageUrl("");
      setPosition("");
      setIsActive(true);
    }
  };

  // Start editing
  const handleEditClick = () => {
    if (sticker) {
      setTitle(sticker.title);
      setImageUrl(sticker.imageUrl);
      setPosition(sticker.position);
      setIsActive(sticker.isActive);
    }
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelClick = () => {
    setIsEditing(false);
    resetForm();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !position) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const method = sticker ? "PATCH" : "POST";
      const url = sticker
        ? `/api/competitions/${competitionId}/default-sticker`
        : `/api/competitions/${competitionId}/default-sticker`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl,
          position,
          isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save default sticker");
      }

      const data = await response.json();
      setSticker(data.sticker);
      setIsEditing(false);

      toast({
        title: "Success",
        description: sticker
          ? "Default sticker updated successfully"
          : "Default sticker created successfully",
      });

      // Refresh the sticker data
      fetchDefaultSticker();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save default sticker",
        variant: "destructive",
      });
      debug.error("Error saving default competition feed sticker:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Default Competition Feed Sticker
          </CardTitle>
          <CardDescription>
            Configure the default sticker that will be applied when no other stickers are available for this competition
          </CardDescription>
        </div>
        {!isEditing && !loading && (
          <Button
            onClick={sticker ? handleEditClick : () => setIsEditing(true)}
            className="bg-primary hover:bg-primary/90"
          >
            {sticker ? "Edit Default Sticker" : "Create Default Sticker"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Sticker Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter sticker title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Select
                  value={position}
                  onValueChange={(value) => setPosition(value as StickerPosition)}
                  required
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(positionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sticker-image">Sticker Image</Label>
                <div className="mt-2">
                  <DirectStickerUploader
                    onUploadComplete={handleImageUpload}
                    existingImageUrl={imageUrl}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : sticker ? (
                  "Update Sticker"
                ) : (
                  "Create Sticker"
                )}
              </Button>
            </div>
          </form>
        ) : sticker ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border bg-white p-2">
                <NextImage
                  src={sticker.imageUrl}
                  alt={sticker.title}
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-medium">{sticker.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-muted">
                      {positionLabels[sticker.position as StickerPosition]}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                      Unlimited
                    </Badge>
                    {sticker.isActive ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This sticker will be applied to media in the competition feed when no other stickers are available.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No Default Sticker</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a default sticker to be applied when no other stickers are available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
