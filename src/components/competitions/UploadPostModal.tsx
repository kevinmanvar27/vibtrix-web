"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import TipTapWrapper from "@/components/ui/tiptap-wrapper";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import CustomImage from "@/components/ui/CustomImage";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import LoadingButton from "@/components/LoadingButton";
import useMediaUpload from "../posts/editor/useMediaUpload";
import { cn } from "@/lib/utils";
import debug from "@/lib/debug";

import "../posts/editor/styles.css";

interface UploadPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  roundId: string;
  roundName: string;
  mediaType: 'IMAGE_ONLY' | 'VIDEO_ONLY' | 'BOTH';
  maxDuration?: number;
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
  roundEnded?: boolean;
  isCompetitionCompleted?: boolean;
}

export default function UploadPostModal({
  isOpen,
  onClose,
  competitionId,
  roundId,
  roundName,
  mediaType,
  maxDuration,
  existingPost,
  roundStarted,
  roundEnded = false,
  isCompetitionCompleted = false
}: UploadPostModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    startUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
    setInitialAttachments,
  } = useMediaUpload({ isCompetitionEntry: true, competitionId });

  // Use a ref to track if we've already initialized attachments
  const initializedRef = useRef(false);
  const existingPostIdRef = useRef<string | undefined>(existingPost?.id);

  // Initialize with existing attachments if available
  useEffect(() => {
    // Only run this effect when the modal opens or closes
    if (!isOpen) {
      // Reset when modal closes
      initializedRef.current = false;
      debug.log('UploadPostModal: Resetting media uploads on modal close');
      resetMediaUploads();
      return;
    }

    // Skip if no existing post or no attachments
    if (!existingPost?.attachments?.length) {
      return;
    }

    // Skip if we've already initialized with this post
    if (initializedRef.current && existingPostIdRef.current === existingPost.id) {
      return;
    }

    debug.log('UploadPostModal: Initializing attachments');
    initializedRef.current = true;
    existingPostIdRef.current = existingPost.id;

    // Map the attachments from the existing post
    const mappedAttachments = existingPost.attachments.map(att => ({
      url: att.url,
      mediaId: att.id,
      type: att.type,
    }));

    // Set the initial attachments
    setInitialAttachments(mappedAttachments);
  }, [isOpen, existingPost?.id, resetMediaUploads, setInitialAttachments]);

  // Use a ref to track the initial content to avoid re-initializing on every render
  const initialContentRef = useRef(existingPost?.content || "");
  const [caption, setCaption] = useState(initialContentRef.current);
  const [editorRef, setEditorRef] = useState<any>(null);

  async function onSubmit() {
    if (isUploading) {
      toast({
        variant: "warning",
        title: "Upload in Progress",
        description: "Please wait for the file upload to complete before submitting."
      });
      return;
    }

    if (attachments.length === 0) {
      toast({
        variant: "destructive",
        title: "No Media Attached",
        description: "Please upload an image or video for your competition entry."
      });
      return;
    }

    // Check if any attachment has an error or is missing a mediaId
    const hasInvalidAttachments = attachments.some(a => a.error || !a.mediaId);
    if (hasInvalidAttachments) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "One or more files failed to upload. Please remove them and try again."
      });
      return;
    }

    try {
      setIsSubmitting(true);
      debug.log(`UploadPostModal: Submitting post with ${attachments.length} attachments`);
      debug.log(`UploadPostModal: Media IDs: ${attachments.map(a => a.mediaId).join(', ')}`);

      const mediaIds = attachments.map((a) => a.mediaId).filter(Boolean) as string[];
      if (mediaIds.length === 0) {
        throw new Error("No valid media IDs found");
      }

      const response = await fetch(`/api/competitions/${competitionId}/submit-post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: caption,
          mediaIds: mediaIds,
          roundId: roundId,
        }),
      });

      // First get the response as text to handle potential JSON parsing errors
      const responseText = await response.text();
      debug.log('UploadPostModal: Response text:', responseText);

      // Check for empty response
      if (!responseText || responseText.trim() === '') {
        debug.error('UploadPostModal: Empty response received from server');
        throw new Error('Server returned an empty response');
      }

      // Parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        debug.error('UploadPostModal: Failed to parse JSON response:', parseError, 'Response was:', responseText);
        throw new Error('Server returned invalid JSON');
      }

      if (!response.ok) {
        debug.error('UploadPostModal: API error response:', data);
        throw new Error(data.error || "Failed to submit post to competition");
      }

      debug.log('UploadPostModal: Post submitted successfully:', data);
      toast({
        title: "Success!",
        description: `Your entry has been submitted for round: ${roundName}`,
      });

      editorRef?.commands.clearContent();
      resetMediaUploads();
      router.refresh();
      onClose();
    } catch (error) {
      debug.error('UploadPostModal: Error submitting post:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit post",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      // Only take the first file to enforce one file per entry
      const files = Array.from(e.target.files).slice(0, 1);

      // Validate file type based on competition requirements
      if (mediaType === 'IMAGE_ONLY' && files.some(file => !file.type.startsWith('image/'))) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "This competition only accepts image files."
        });
        e.target.value = "";
        return;
      }

      if (mediaType === 'VIDEO_ONLY' && files.some(file => !file.type.startsWith('video/'))) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "This competition only accepts video files."
        });
        e.target.value = "";
        return;
      }

      // Check video duration if applicable
      if (maxDuration && files.some(file => file.type.startsWith('video/'))) {
        const videoFile = files.find(file => file.type.startsWith('video/'));
        if (videoFile) {
          // Create a temporary video element to check duration
          const video = document.createElement('video');
          video.preload = 'metadata';

          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);

            if (video.duration > maxDuration) {
              toast({
                variant: "destructive",
                title: "Video Too Long",
                description: `Video duration (${Math.round(video.duration)} seconds) exceeds the maximum allowed duration (${maxDuration} seconds) for this competition.`
              });

              // Clear the file input
              e.target.value = "";
              setAttachments([]);
              return;
            }
          };

          video.src = URL.createObjectURL(videoFile);
        }
      }

      debug.log(`UploadPostModal: Starting upload of ${files.length} files for competition ${competitionId}`);
      startUpload(files);
      e.target.value = "";
    }
  }

  // Determine the accept attribute for the file input based on mediaType
  const getAcceptAttribute = () => {
    switch (mediaType) {
      case 'IMAGE_ONLY':
        return 'image/*';
      case 'VIDEO_ONLY':
        return 'video/*';
      default:
        return 'image/*,video/*';
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {existingPost ? "Edit Entry" : "Upload Entry"} for {roundName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Status message */}
          {existingPost ? (
            roundStarted ? (
              <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 px-3 py-2 rounded-lg border border-green-200/50 dark:border-green-800/30 shadow-sm">
                <div className="bg-green-500/20 dark:bg-green-500/30 p-1.5 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="font-medium text-green-700 dark:text-green-400">Your entry is locked and cannot be changed</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 px-3 py-2 rounded-lg border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
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
            <div className="flex items-center gap-2 text-xs bg-gradient-to-r from-primary-50/50 to-primary-100/30 dark:from-primary-950/20 dark:to-primary-900/10 px-3 py-2 rounded-lg border border-primary/10 dark:border-primary/5 shadow-sm">
              <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M8 12h8" />
                  <path d="M12 8v8" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-foreground dark:text-primary-foreground/80">Add a caption (optional) and upload media</span>
                <p className="mt-1 text-xs text-muted-foreground">You can only submit one entry per round</p>
              </div>
            </div>
          )}

          {/* Caption editor */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Caption (optional)</label>
            <TipTapWrapper
              content={existingPost?.content || ""}
              placeholder="Add a caption for your competition entry... (optional)"
              onChange={setCaption}
              className={`tiptap-editor-content max-h-[10rem] w-full overflow-y-auto rounded-lg border ${(roundStarted && existingPost) || roundEnded ? 'border-muted bg-muted/10' : 'border-border bg-background/80 backdrop-blur-sm'} px-3 py-2 text-sm`}
              disabled={(roundStarted && existingPost) || roundEnded}
              onEditorReady={setEditorRef}
            />
          </div>

          {/* Media upload area */}
          <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" />
                Media Upload
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-2.5 py-1.5 rounded-full border border-border/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.48-8.48l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {attachments.length > 0 ? (
                  <span>{attachments.length}/1 file</span>
                ) : (
                  <span>No files</span>
                )}
              </div>
            </div>

            {/* Upload button area or preview */}
            <div className="relative border-2 border-dashed border-primary/20 dark:border-primary/10 rounded-lg overflow-hidden">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={getAcceptAttribute()}
                onChange={handleFileSelect}
                disabled={isUploading || attachments.length >= 1 || (existingPost && roundStarted) || roundEnded}
              />

              {attachments.length > 0 ? (
                <div className="relative aspect-square w-full overflow-hidden bg-black">
                  {/* Media preview */}
                  {(() => {
                    // Create object URL safely with try-catch
                    let previewUrl = attachments[0].url;
                    if (!previewUrl) {
                      try {
                        previewUrl = URL.createObjectURL(attachments[0].file);
                        debug.log(`Created object URL for preview: ${previewUrl}`);
                      } catch (e) {
                        debug.error('Failed to create object URL:', e);
                      }
                    }

                    if (attachments[0].file.type.startsWith("image")) {
                      return (
                        <div className="flex items-center justify-center h-full w-full">
                          {previewUrl ? (
                            <CustomImage
                              src={previewUrl}
                              alt="Attachment preview"
                              width={300}
                              height={300}
                              className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-muted/50">
                              <p className="text-sm text-muted-foreground">Loading image preview...</p>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center justify-center h-full w-full">
                          {previewUrl ? (
                            <CustomVideoPlayer
                              src={previewUrl}
                              onError={() => {
                                debug.error(`Video error for source: ${previewUrl}`);
                              }}
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-muted/50">
                              <p className="text-sm text-muted-foreground">Loading video preview...</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}

                  {/* File type indicator */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs px-3 py-2 z-10">
                    <span>{attachments[0].file.type.startsWith("image") ? "Image" : "Video"}</span>
                  </div>

                  {/* Remove button */}
                  {!isUploading && !(existingPost && roundStarted) && !roundEnded && (
                    <button
                      onClick={() => removeAttachment(attachments[0].file.name)}
                      className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-all duration-300 hover:bg-red-500 z-20 shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`p-6 text-center ${!isUploading && !(existingPost && roundStarted) && !roundEnded && !isCompetitionCompleted ? 'hover:bg-primary/5 transition-colors duration-200 cursor-pointer' : ''}`}
                  onClick={() => !isUploading && !(existingPost && roundStarted) && !roundEnded && !isCompetitionCompleted && fileInputRef.current?.click()}
                >
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {mediaType === 'IMAGE_ONLY' ? 'Supports images only' :
                          mediaType === 'VIDEO_ONLY' ? 'Supports videos only' :
                            'Supports images and videos'} (max 1 file)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Uploading {uploadProgress ?? 0}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media preview section removed - now integrated into the upload box */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {!roundEnded && !isCompetitionCompleted && (
            <LoadingButton
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={isUploading || attachments.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {existingPost ? "Update Entry" : "Submit Entry"}
            </LoadingButton>
          )}
          {!roundStarted && (
            <div className="text-xs font-medium px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-700 dark:text-blue-400">
              Round hasn't started yet - Your entry will appear in the feed when the round begins
            </div>
          )}
          {roundEnded && existingPost && (
            <div className="text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-muted-foreground">
              Round completed - Entry cannot be modified
            </div>
          )}
          {isCompetitionCompleted && (
            <div className="text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-muted-foreground">
              Competition completed - Uploads are closed
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// AttachmentPreview component removed - now integrated directly into the upload box
