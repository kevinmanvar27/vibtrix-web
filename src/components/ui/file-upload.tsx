"use client";

import React from "react";
import { CustomUploadButton, CustomUploadDropzone, CustomUploader } from "@/lib/customUpload";
import { useToast } from "@/components/ui/use-toast";

// Re-export the custom upload components with toast integration
export function UploadButton({
  uploadType,
  onClientUploadComplete,
  onUploadError,
  ...props
}: React.ComponentProps<typeof CustomUploadButton> & {
  onClientUploadComplete?: (result: any) => void;
}) {
  const { toast } = useToast();

  const handleUploadComplete = (result: any) => {
    if (onClientUploadComplete) {
      onClientUploadComplete(result);
    }
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    });

    if (onUploadError) {
      onUploadError(error);
    }
  };

  return (
    <CustomUploadButton
      uploadType={uploadType}
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      {...props}
    />
  );
}

export function UploadDropzone({
  uploadType,
  onClientUploadComplete,
  onUploadError,
  ...props
}: React.ComponentProps<typeof CustomUploadDropzone> & {
  onClientUploadComplete?: (result: any) => void;
}) {
  const { toast } = useToast();

  const handleUploadComplete = (result: any) => {
    if (onClientUploadComplete) {
      onClientUploadComplete(result);
    }
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    });

    if (onUploadError) {
      onUploadError(error);
    }
  };

  return (
    <CustomUploadDropzone
      uploadType={uploadType}
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      {...props}
    />
  );
}

export function Uploader({
  uploadType,
  onClientUploadComplete,
  onUploadError,
  ...props
}: React.ComponentProps<typeof CustomUploader> & {
  onClientUploadComplete?: (result: any) => void;
}) {
  const { toast } = useToast();

  const handleUploadComplete = (result: any) => {
    if (onClientUploadComplete) {
      onClientUploadComplete(result);
    }
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    });

    if (onUploadError) {
      onUploadError(error);
    }
  };

  return (
    <CustomUploader
      uploadType={uploadType}
      onUploadComplete={handleUploadComplete}
      onUploadError={handleUploadError}
      {...props}
    />
  );
}
