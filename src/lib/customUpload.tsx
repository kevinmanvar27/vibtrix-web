"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon, FileVideo } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

import debug from "@/lib/debug";

// Types for the custom upload components
type UploadType = "avatar" | "attachment" | "sticker";

interface UploadResult {
  success: boolean;
  files: Array<{
    avatarUrl?: string;
    stickerUrl?: string;
    mediaId?: string;
    url?: string;
  }>;
  error?: string;
}

interface UploadButtonProps {
  uploadType: UploadType;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  children?: React.ReactNode;
}

interface UploadDropzoneProps {
  uploadType: UploadType;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  children?: React.ReactNode;
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

// Default accept values based on upload type
const defaultAccept = {
  avatar: "image/*",
  attachment: "image/*,video/*",
  sticker: "image/*",
};

// Helper function to get file type icon
const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      URL.revokeObjectURL(preview as string);
    };
  }, [file, preview]);

  const isImage = file.type.startsWith("image/");

  return (
    <div className="relative rounded-md border border-border p-1 w-20 h-20 flex items-center justify-center">
      {isImage && preview ? (
        <Image
          src={preview}
          alt={file.name}
          width={80}
          height={80}
          className="object-contain max-h-full max-w-full"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-xs text-muted-foreground">
          {file.type.startsWith("video/") ? (
            <FileVideo className="h-8 w-8 text-primary" />
          ) : (
            <ImageIcon className="h-8 w-8 text-primary" />
          )}
          <span className="mt-1 truncate w-full text-center">
            {file.name.length > 10
              ? `${file.name.substring(0, 7)}...${file.name.substring(
                  file.name.lastIndexOf(".")
                )}`
              : file.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

// Custom upload button component
export const CustomUploadButton: React.FC<UploadButtonProps> = ({
  uploadType,
  onUploadComplete,
  onUploadError,
  className,
  variant = "default",
  disabled = false,
  multiple = false,
  accept,
  children,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enforce single file for avatar and sticker
  const isMultiple = uploadType === "attachment" ? multiple : false;
  const acceptTypes = accept || defaultAccept[uploadType];

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("uploadType", uploadType);

      // Add files to form data
      Array.from(files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // Send request to custom upload API
      const response = await fetch("/api/upload/custom", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      // Call onUploadComplete callback
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      debug.error("Upload error:", error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptTypes}
        multiple={isMultiple}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant={variant}
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={className}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          children || (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )
        )}
      </Button>
    </>
  );
};

// Custom upload dropzone component
export const CustomUploadDropzone: React.FC<UploadDropzoneProps> = ({
  uploadType,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false,
  multiple = false,
  accept,
  children,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enforce single file for avatar and sticker
  const isMultiple = uploadType === "attachment" ? multiple : false;
  const acceptTypes = accept || defaultAccept[uploadType];

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Filter files based on accept attribute
    const validFiles = droppedFiles.filter(file => {
      if (!acceptTypes) return true;
      
      const fileType = file.type;
      return acceptTypes.split(',').some(type => {
        type = type.trim();
        if (type === '*/*') return true;
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(`${category}/`);
        }
        return fileType === type;
      });
    });

    if (validFiles.length === 0) return;

    // For single file uploads, only take the first file
    if (!isMultiple) {
      setFiles([validFiles[0]]);
    } else {
      setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Limit to 5 files
    }
  }, [disabled, isUploading, isMultiple, acceptTypes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (!isMultiple) {
      setFiles([selectedFiles[0]]);
    } else {
      setFiles(prev => [...prev, ...Array.from(selectedFiles)].slice(0, 5)); // Limit to 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("uploadType", uploadType);

      // Add files to form data
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // Send request to custom upload API
      const response = await fetch("/api/upload/custom", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      // Call onUploadComplete callback
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Clear files after successful upload
      setFiles([]);
    } catch (error) {
      debug.error("Upload error:", error);
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          disabled || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        {children || (
          <>
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag & drop {isMultiple ? "files" : "file"} here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {uploadType === "avatar" && "JPG, PNG or WebP (max. 512KB)"}
              {uploadType === "attachment" && "JPG, PNG, WebP (max. 5MB) or MP4 (max. 64MB)"}
              {uploadType === "sticker" && "JPG, PNG or WebP (max. 1MB)"}
            </p>
          </>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptTypes}
          multiple={isMultiple}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.length} {files.length === 1 ? "file" : "files"}
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
};

// Export a custom uploader component that combines both button and dropzone
export const CustomUploader: React.FC<
  UploadButtonProps & { mode?: "button" | "dropzone" }
> = ({ mode = "button", ...props }) => {
  return mode === "button" ? (
    <CustomUploadButton {...props} />
  ) : (
    <CustomUploadDropzone {...props} />
  );
};
