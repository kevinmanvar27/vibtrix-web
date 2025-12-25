"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MediaType } from "@prisma/client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { ImageIcon, Loader2, Trash, Upload } from "lucide-react";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import { cn } from "@/lib/utils";

import debug from "@/lib/debug";

interface MediaUploaderProps {
  mediaType?: MediaType;
  onMediaUploaded: (mediaId: string) => void;
  mediaId?: string;
}

export default function MediaUploader({
  mediaType = "IMAGE",
  onMediaUploaded,
  mediaId,
}: MediaUploaderProps) {
  const { toast } = useToast();
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If we have a mediaId, fetch the media details
    if (mediaId) {
      const fetchMedia = async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/media/${mediaId}`);
          if (response.ok) {
            const media = await response.json();
            setMediaUrl(media.url);
          }
        } catch (error) {
          debug.error("Error fetching media:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMedia();
    }
  }, [mediaId]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);

      // Validate file type
      const fileType = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';
      if ((mediaType === 'IMAGE' && !file.type.startsWith('image/')) ||
        (mediaType === 'VIDEO' && !file.type.startsWith('video/'))) {
        toast({
          title: "Invalid file type",
          description: `Please upload a ${mediaType.toLowerCase()} file.`,
          variant: "destructive",
        });
        return;
      }

      // Upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === undefined) return 10;
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 300);

      // Create form data
      const formData = new FormData();
      formData.append('files', file);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error (${response.status}): Failed to upload file`);
      }

      const result = await response.json();

      if (!result.files || !Array.isArray(result.files) || !result.files[0]) {
        throw new Error('Invalid server response format');
      }

      const uploadedFile = result.files[0];
      setMediaUrl(uploadedFile.url);
      onMediaUploaded(uploadedFile.mediaId);

      toast({
        title: "Upload complete",
        description: `The ${mediaType.toLowerCase()} has been uploaded successfully.`,
      });
    } catch (error) {
      debug.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : `Failed to upload ${mediaType.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(undefined);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaUrl("");
    onMediaUploaded("");
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={mediaType === "IMAGE" ? "image/*" : "video/*"}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 bg-muted rounded-md">
          <p className="text-muted-foreground">Loading media...</p>
        </div>
      ) : mediaUrl ? (
        <div className="relative">
          {mediaType === "IMAGE" ? (
            <div className="relative h-64 w-full">
              <Image
                src={mediaUrl}
                alt="Advertisement image"
                fill
                className="object-contain rounded-md"
              />
            </div>
          ) : (
            <div className="w-full aspect-video">
              <CustomVideoPlayer
                src={mediaUrl}
                poster={undefined}
                className="w-full rounded-md"
              />
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemoveMedia}
          >
            <Trash className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-sm font-medium">Uploading {mediaType.toLowerCase()}...</p>
                <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center space-y-4 cursor-pointer"
              onClick={triggerFileInput}
            >
              <div className="p-4 bg-primary/10 rounded-full">
                {mediaType === "IMAGE" ? (
                  <ImageIcon className="h-8 w-8 text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload {mediaType.toLowerCase()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mediaType === "IMAGE" ? "SVG, PNG, JPG or GIF" : "MP4, WebM or OGG"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select {mediaType.toLowerCase()}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
