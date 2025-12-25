"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { editCompetitionPost } from "../posts/client-actions";
import { Pencil, ImageIcon, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateCompetitionFeedQueries } from "@/lib/query-utils";
import useMediaUpload from "../posts/editor/useMediaUpload";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import debug from "@/lib/debug";

interface EditCompetitionPostButtonProps {
  postId: string;
  competitionId: string;
  initialContent: string;
  mediaIds: string[];
  attachments?: Array<{
    id: string;
    url: string;
    type: 'IMAGE' | 'VIDEO';
  }>;
}

export default function EditCompetitionPostButton({
  postId,
  competitionId,
  initialContent,
  mediaIds,
  attachments = [],
}: EditCompetitionPostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Use the media upload hook
  const {
    startUpload,
    attachments: mediaAttachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
    setInitialAttachments,
  } = useMediaUpload({ isCompetitionEntry: true, competitionId });

  // Use a ref to track if we've already initialized attachments
  const initializedRef = useRef(false);

  // Initialize with existing attachments when dialog opens
  useEffect(() => {
    if (isOpen && attachments.length > 0 && !initializedRef.current) {
      debug.log('EditCompetitionPostButton: Initializing attachments');
      initializedRef.current = true;

      // Map the attachments from the existing post
      const mappedAttachments = attachments.map(att => ({
        url: att.url,
        mediaId: att.id,
        type: att.type,
      }));

      // Set the initial attachments
      setInitialAttachments(mappedAttachments);
    }

    // Reset when dialog closes
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen, attachments, setInitialAttachments]);

  // Create a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (isUploading) {
      toast({
        variant: "destructive",
        title: "Upload in progress",
        description: "Please wait for the upload to complete before saving."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get media IDs from attachments
      const currentMediaIds = mediaAttachments.map(a => a.mediaId).filter(Boolean) as string[];

      // Use current media IDs if available, otherwise use the original ones
      const finalMediaIds = currentMediaIds.length > 0 ? currentMediaIds : mediaIds;

      await editCompetitionPost({
        postId,
        content,
        mediaIds: finalMediaIds,
        competitionId,
      });

      // Manually invalidate all competition feed queries to ensure fresh data
      invalidateCompetitionFeedQueries(queryClient, competitionId);

      setIsOpen(false);
      resetMediaUploads();
    } catch (error) {
      debug.error("Error editing post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to edit post"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetMediaUploads();
          }
          setIsOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Competition Post</DialogTitle>
            <DialogDescription>
              Make changes to your competition post. This will update the post in all views.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[100px]"
            />

            {/* Media attachments preview */}
            {!!mediaAttachments.length && (
              <div className="grid grid-cols-1 gap-3">
                {mediaAttachments.map((attachment) => (
                  <div
                    key={attachment.file.name}
                    className="group relative aspect-video w-full overflow-hidden rounded-xl border border-border"
                  >
                    {attachment.url ? (
                      attachment.file.type.startsWith("image/") ? (
                        <div className="flex items-center justify-center h-full w-full">
                          <Image
                            src={attachment.url}
                            alt="Attachment"
                            width={500}
                            height={300}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full w-full">
                          <video
                            src={attachment.url}
                            className="max-h-full max-w-full object-contain"
                            controls
                          />
                        </div>
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.file.name)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload controls */}
            <div className="flex items-center justify-end gap-3">
              {isUploading && (
                <>
                  <span className="text-sm">{uploadProgress ?? 0}%</span>
                  <Loader2 className="size-5 animate-spin text-primary" />
                </>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5",
                  (isUploading || mediaAttachments.length >= 1) && "opacity-50"
                )}
                disabled={isUploading || mediaAttachments.length >= 1}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="size-4" />
                <span>Add Media</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length) {
                    startUpload(files);
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetMediaUploads();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
