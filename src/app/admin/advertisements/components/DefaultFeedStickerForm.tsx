"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  isActive: boolean;
}

interface DefaultFeedStickerFormProps {
  // Add props if needed
}

export function DefaultFeedStickerForm({}: DefaultFeedStickerFormProps) {
  const { toast } = useToast();
  const [sticker, setSticker] = useState<DefaultFeedSticker | null>(null);
  const [loading, setLoading] = useState(true);
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
    fetchDefaultSticker();
  }, []);

  // Fetch default sticker from the API
  const fetchDefaultSticker = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/feed-stickers/default");

      if (!response.ok) {
        if (response.status === 404) {
          // No default sticker found, that's okay
          setSticker(null);
          return;
        }
        throw new Error("Failed to fetch default feed sticker");
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
      debug.error("Error fetching default feed sticker:", error);
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
    resetForm();
    setIsEditing(false);
  };

  // Save default sticker
  const handleSave = async () => {
    if (!title || !imageUrl || !position) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const method = sticker ? "PATCH" : "POST";
      const url = sticker
        ? `/api/feed-stickers/default/${sticker.id}`
        : "/api/feed-stickers/default";

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
        throw new Error(errorData.error || `Failed to ${sticker ? 'update' : 'create'} default feed sticker`);
      }

      toast({
        title: "Success",
        description: `Default feed sticker ${sticker ? 'updated' : 'created'} successfully.`,
      });

      // Refresh sticker
      fetchDefaultSticker();

      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      debug.error(`Error ${sticker ? 'updating' : 'creating'} default feed sticker:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${sticker ? 'update' : 'create'} default feed sticker. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete default sticker
  const handleDelete = async () => {
    if (!sticker) return;

    if (!confirm("Are you sure you want to delete the default feed sticker? This action cannot be undone.")) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/feed-stickers/default/${sticker.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete default feed sticker");
      }

      toast({
        title: "Success",
        description: "Default feed sticker deleted successfully.",
      });

      // Refresh sticker (should be null now)
      setSticker(null);
      resetForm();
      setIsEditing(false);
    } catch (error) {
      debug.error("Error deleting default feed sticker:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete default feed sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Render form content
  const renderFormContent = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isActive" className="text-right">
          Active
        </Label>
        <div className="flex items-center space-x-2 col-span-3">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <span className="text-sm text-muted-foreground">
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Image</Label>
        <div className="col-span-3">
          {imageUrl ? (
            <div className="relative h-32 w-32 mx-auto">
              <NextImage
                src={imageUrl}
                alt={title || "Sticker preview"}
                fill
                sizes="128px"
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
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Default Feed Sticker
          </CardTitle>
          <CardDescription>
            Configure the default sticker that will be applied when no other stickers are available
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
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
            <p className="text-sm text-muted-foreground">Loading default sticker...</p>
          </div>
        ) : isEditing ? (
          <div className="space-y-6 bg-card rounded-lg p-6 border border-border/50">
            {renderFormContent()}
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCancelClick}
                disabled={submitting}
                className="border-muted-foreground/30"
              >
                Cancel
              </Button>
              {sticker && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {sticker ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  sticker ? "Update" : "Create"
                )}
              </Button>
            </div>
          </div>
        ) : sticker ? (
          <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-medium">{sticker.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={sticker.isActive ? "default" : "secondary"} className={sticker.isActive ? "bg-green-500" : ""}>
                    {sticker.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Position: {positionLabels[sticker.position]}
                  </span>
                </div>
              </div>
              <div className="relative h-40 w-40 mx-auto md:mx-0 bg-muted/30 rounded-lg p-2">
                <NextImage
                  src={sticker.imageUrl}
                  alt={sticker.title}
                  fill
                  sizes="160px"
                  className="object-contain p-2"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted/10 rounded-lg border border-dashed border-muted">
            <div className="p-3 rounded-full bg-muted/30">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No default feed sticker configured.</p>
              <p className="text-sm text-muted-foreground">
                The default sticker will be used when all other stickers have reached their usage limits.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
