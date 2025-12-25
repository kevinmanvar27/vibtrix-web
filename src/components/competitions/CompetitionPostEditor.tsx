"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ImageIcon, Loader2, X } from "lucide-react";
import CustomImage from "@/components/ui/CustomImage";
import { useRouter } from "next/navigation";
import { ClipboardEvent, useRef, useState } from "react";
import * as React from "react";
import useMediaUpload, { Attachment } from "../posts/editor/useMediaUpload";

import debug from "@/lib/debug";

interface CompetitionPostEditorProps {
  competitionId: string;
  roundId: string;
  roundName: string;
  existingPost?: {
    id: string;
    content: string;
    attachments: Array<{
      id: string;
      url: string;
      type: 'IMAGE' | 'VIDEO';
    }>;
  };
  roundStarted: boolean;
}

export default function CompetitionPostEditor({
  competitionId,
  roundId,
  roundName,
  existingPost,
  roundStarted
}: CompetitionPostEditorProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    startUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
    setInitialAttachments,
  } = useMediaUpload({ isCompetitionEntry: true, competitionId });

  // Create a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a ref to track if we've already initialized attachments
  const initializedRef = useRef(false);

  // Initialize with existing attachments if available
  React.useEffect(() => {
    // Only set initial attachments if we have attachments, none are currently loaded, and we haven't initialized yet
    if (existingPost?.attachments?.length && attachments.length === 0 && !initializedRef.current) {
      debug.log('CompetitionPostEditor: Initializing attachments');
      initializedRef.current = true;
      setInitialAttachments(existingPost.attachments.map(att => ({
        url: att.url,
        mediaId: att.id,
        type: att.type,
      })));
    }
  }, [existingPost, attachments.length]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      Placeholder.configure({
        placeholder: "Add a caption for your competition entry... (optional)",
      }),
    ],
    content: existingPost?.content || "",
    immediatelyRender: false, // Fix for SSR hydration mismatches
  });

  const input =
    editor?.getText({
      blockSeparator: "\n",
    }) || "";

  async function onSubmit() {
    if (isUploading || attachments.length === 0) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/competitions/${competitionId}/submit-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: input,
          mediaIds: attachments.map((a) => a.mediaId).filter(Boolean) as string[],
          roundId: roundId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit post to competition");
      }

      toast({
        title: "Success!",
        description: `Your entry has been submitted for round: ${roundName}`,
      });

      editor?.commands.clearContent();
      resetMediaUploads();
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit post",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile()) as File[];
    startUpload(files);
  }

  return (
    <div className="flex flex-col gap-3">
      {existingPost ? (
        roundStarted ? (
          <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 px-3 py-2 rounded-lg border border-green-200/50 dark:border-green-800/30 mb-2 shadow-sm">
            <div className="bg-green-500/20 dark:bg-green-500/30 p-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="font-medium text-green-700 dark:text-green-400">Your entry is locked and cannot be changed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 px-3 py-2 rounded-lg border border-blue-200/50 dark:border-blue-800/30 mb-2 shadow-sm">
            <div className="bg-blue-500/20 dark:bg-blue-500/30 p-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <span className="font-medium text-blue-700 dark:text-blue-400">You can edit your entry until the round starts</span>
          </div>
        )
      ) : (
        <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-primary-50/50 to-primary-100/30 dark:from-primary-950/20 dark:to-primary-900/10 px-3 py-2 rounded-lg border border-primary/10 dark:border-primary/5 mb-2 shadow-sm">
          <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          </div>
          <span className="font-medium text-primary-foreground/80 dark:text-primary-foreground/70">Add a caption (optional) and upload media</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
        {/* Left column: Caption editor and upload controls */}
        <div className="space-y-3">
          <div className="w-full">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Caption (optional)</label>
            <EditorContent
              editor={editor}
              className={`max-h-[10rem] w-full overflow-y-auto rounded-lg border ${roundStarted && existingPost ? 'border-muted bg-muted/10' : 'border-border bg-background/80 backdrop-blur-sm focus-within:ring-1 focus-within:ring-primary/20'} px-3 py-2 text-sm`}
              onPaste={onPaste}
              disabled={roundStarted && existingPost}
            />
          </div>

          <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Media Upload
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-2.5 py-1.5 rounded-full border border-border/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.48-8.48l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {attachments.length > 0 ? (
                  <span>{attachments.length}/5 files</span>
                ) : (
                  <span>No files</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative border-2 border-dashed border-primary/20 dark:border-primary/10 rounded-lg p-6 text-center hover:bg-primary/5 transition-colors duration-200 cursor-pointer" onClick={() => !isUploading && !(existingPost && roundStarted) && fileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*, video/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      startUpload(Array.from(e.target.files));
                      e.target.value = "";
                    }
                  }}
                  disabled={isUploading || attachments.length >= 5 || (existingPost && roundStarted)}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="bg-primary/10 rounded-full p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                      <line x1="16" x2="22" y1="5" y2="5" />
                      <line x1="19" x2="19" y1="2" y2="8" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports images and videos (max 5 files)</p>
                  </div>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full animate-pulse">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm font-medium">Uploading {uploadProgress ?? 0}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                {(!existingPost || !roundStarted) && (
                  <LoadingButton
                    onClick={onSubmit}
                    loading={isSubmitting}
                    disabled={isUploading || attachments.length === 0}
                    className="h-10 px-5 text-sm bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
                  >
                    {existingPost ? "Update Entry" : "Submit Entry"}
                  </LoadingButton>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Media preview */}
        <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4 border border-border">
          <h4 className="text-sm font-medium flex items-center gap-1.5 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            Media Preview
          </h4>

          {attachments.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.file.name}
                  attachment={attachment}
                  onRemoveClick={() => removeAttachment(attachment.file.name)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border border-dashed border-border rounded-lg p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                <path d="M18 6h-5c-1.1 0-2 .9-2 2v8" />
                <path d="M10 8.5a2.5 2.5 0 0 0-5 0v5a2.5 2.5 0 0 0 5 0" />
                <path d="M21 19h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2z" />
              </svg>
              <p className="text-sm">No media files attached</p>
              <p className="text-xs mt-1">Upload media to see preview here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// We've removed the AddAttachmentsButton component since we're now using the inline file input

interface AttachmentPreviewsProps {
  attachments: Attachment[];
  removeAttachment: (fileName: string) => void;
}

function AttachmentPreviews({
  attachments,
  removeAttachment,
}: AttachmentPreviewsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {attachments.map((attachment) => (
        <AttachmentPreview
          key={attachment.file.name}
          attachment={attachment}
          onRemoveClick={() => removeAttachment(attachment.file.name)}
        />
      ))}
    </div>
  );
}

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemoveClick: () => void;
}

function AttachmentPreview({
  attachment: { file, mediaId, isUploading, url },
  onRemoveClick,
}: AttachmentPreviewProps) {
  // Use the provided URL if available, otherwise create one from the file
  const [src, setSrc] = React.useState<string>(url || '');
  const [error, setError] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Reset error state when attachment changes
    setError(false);

    // If we have a URL from the server, use it
    if (url) {
      debug.log(`AttachmentPreview: Using provided URL: ${url}`);
      setSrc(url);
      return;
    }

    // Only create object URL if we don't have a URL and file exists
    if (file && !src) {
      try {
        debug.log(`AttachmentPreview: Creating object URL for file: ${file.name}`);
        const objectUrl = URL.createObjectURL(file);
        setSrc(objectUrl);
        debug.log(`AttachmentPreview: Created object URL: ${objectUrl}`);

        // Clean up the object URL when component unmounts
        return () => {
          debug.log(`AttachmentPreview: Revoking object URL: ${objectUrl}`);
          URL.revokeObjectURL(objectUrl);
        };
      } catch (e) {
        debug.error('AttachmentPreview: Failed to create object URL:', e);
        setError(true);
      }
    }
  }, [file, url]);

  return (
    <div
      className={cn("relative mx-auto",
        isUploading && "opacity-50")}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted/30 border border-border/50 shadow-sm group hover:shadow-md transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
        {file.type.startsWith("image") ? (
          <CustomImage
            src={src}
            alt="Attachment preview"
            width={300}
            height={300}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <video controls className="h-full w-full object-cover" onError={() => setError(true)}>
            <source src={src} type={file.type} />
          </video>
        )}
        {!isUploading && (
          <button
            onClick={onRemoveClick}
            className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-all duration-300 hover:bg-red-500 z-20 opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <X size={14} />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs px-3 py-2 z-10">
          <span>{file.type.startsWith("image") ? "Image" : "Video"}</span>
        </div>
      </div>
    </div>
  );
}
