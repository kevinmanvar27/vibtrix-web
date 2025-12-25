"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import TipTapWrapper from "@/components/ui/tiptap-wrapper";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";

import { ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { useSubmitPostMutation } from "./mutations";
import "./styles.css";
import useMediaUpload, { Attachment } from "./useMediaUpload";

import debug from "@/lib/debug";

export default function PostEditor() {
  const { user, isLoggedIn } = useSession();

  const mutation = useSubmitPostMutation();

  const {
    startUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
  } = useMediaUpload();

  const [postContent, setPostContent] = useState("");

  function onSubmit() {
    if (!user) return; // Don't submit if user is not logged in

    mutation.mutate(
      {
        content: postContent,
        mediaIds: attachments.map((a) => a.mediaId).filter(Boolean) as string[],
      },
      {
        onSuccess: () => {
          setPostContent("");
          resetMediaUploads();
        },
      },
    );
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile()) as File[];
    startUpload(files);
  }

  // If user is not logged in, don't render the editor
  if (!isLoggedIn || !user) {
    return (
      <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-center text-muted-foreground">
          Please log in to create a post.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex gap-5">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          className="hidden sm:inline"
          showStatus={true}
          status={user.onlineStatus}
          statusSize="sm"
        />
        <div className="w-full">
          <TipTapWrapper
            content=""
            placeholder="What's on your mind today?"
            onChange={setPostContent}
            className="max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3"
          />
        </div>
      </div>
      {!!attachments.length && (
        <AttachmentPreviews
          attachments={attachments}
          removeAttachment={removeAttachment}
        />
      )}
      <div className="flex items-center justify-end gap-3">
        {isUploading && (
          <>
            <span className="text-sm">{uploadProgress ?? 0}%</span>
            <Loader2 className="size-5 animate-spin text-primary" />
          </>
        )}
        <AddAttachmentsButton
          onFilesSelected={startUpload}
          disabled={isUploading || attachments.length >= 5}
        />
        <LoadingButton
          onClick={onSubmit}
          loading={mutation.isPending}
          disabled={(attachments.length === 0) || isUploading}
          className="min-w-20"
        >
          Post
        </LoadingButton>
      </div>
    </div>
  );
}

interface AddAttachmentsButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

function AddAttachmentsButton({
  onFilesSelected,
  disabled,
}: AddAttachmentsButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary hover:text-primary"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon size={20} />
      </Button>
      <input
        type="file"
        accept="image/*, video/*"
        multiple
        ref={fileInputRef}
        className="sr-only hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) {
            onFilesSelected(files);
            e.target.value = "";
          }
        }}
      />
    </>
  );
}

interface AttachmentPreviewsProps {
  attachments: Attachment[];
  removeAttachment: (fileName: string) => void;
}

function AttachmentPreviews({
  attachments,
  removeAttachment,
}: AttachmentPreviewsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        attachments.length > 1 && "sm:grid sm:grid-cols-2",
      )}
    >
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
  const [src, setSrc] = useState<string>(url || '');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // Reset error state when attachment changes
    setError(false);

    // If we have a URL from the server, use it
    if (url) {
      debug.log(`AttachmentPreview: Using provided URL: ${url}`);
      setSrc(url);
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      setSrc(objectUrl);

      // Clean up the object URL when component unmounts
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } catch (e) {
      debug.error('Failed to create object URL:', e);
      setError(true);
    }
  }, [file, url]);

  return (
    <div
      className={cn("relative mx-auto size-fit", isUploading && "opacity-50")}
    >
      {error ? (
        <div className="flex items-center justify-center h-64 w-full bg-red-50 dark:bg-red-900/20 rounded-2xl">
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load preview</p>
          </div>
        </div>
      ) : file.type.startsWith("image") ? (
        <Image
          src={src}
          alt="Attachment preview"
          width={500}
          height={500}
          unoptimized={true}
          onError={() => setError(true)}
          className="size-fit max-h-[30rem] rounded-2xl"
        />
      ) : (
        <CustomVideoPlayer
          src={src}
          onError={() => setError(true)}
          className="size-fit max-h-[30rem] rounded-2xl"
          autoPlay={false}
          muted={true}
          loop={true}
        />
      )}
      {!isUploading && (
        <button
          onClick={onRemoveClick}
          className="absolute right-3 top-3 rounded-full bg-foreground p-1.5 text-background transition-colors hover:bg-foreground/60"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
