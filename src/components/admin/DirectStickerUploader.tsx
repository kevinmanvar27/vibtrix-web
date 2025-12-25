"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";

import debug from "@/lib/debug";

interface DirectStickerUploaderProps {
  onUploadComplete: (url: string) => void;
  existingImageUrl?: string;
  className?: string;
}

export default function DirectStickerUploader({
  onUploadComplete,
  existingImageUrl,
  className = "",
}: DirectStickerUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(existingImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 1MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file
      const response = await fetch("/api/stickers/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload sticker");
      }

      const data = await response.json();

      if (data.success && data.stickerUrl) {
        toast({
          title: "Upload complete",
          description: "Sticker uploaded successfully",
        });
        setImageUrl(data.stickerUrl);
        onUploadComplete(data.stickerUrl);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      debug.error("Error uploading sticker:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload sticker",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Update imageUrl when existingImageUrl changes
  useEffect(() => {
    setImageUrl(existingImageUrl);
  }, [existingImageUrl]);

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    onUploadComplete(""); // Notify parent component that image was removed
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative h-32 w-32 mx-auto">
          <img
            src={imageUrl}
            alt="Sticker preview"
            className="h-full w-full object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2"
            onClick={handleRemoveImage}
          >
            Remove
          </Button>
        </div>
      ) : (
        <>
          <Button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Sticker
              </>
            )}
          </Button>
          <div className="text-xs text-muted-foreground mt-1">Max 1MB</div>
        </>
      )}
    </div>
  );
}
