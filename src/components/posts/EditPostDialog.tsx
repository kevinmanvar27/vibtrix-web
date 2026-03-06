import { PostData } from "@/lib/types";
import { useEffect, useRef } from "react";
import { ClipboardEvent } from "react";
import { useSession } from "@/app/(main)/SessionProvider";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { useEditPostMutation } from "./mutations";
import useMediaUpload from "../posts/editor/useMediaUpload";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import "../posts/editor/styles.css";

import debug from "@/lib/debug";

interface EditPostDialogProps {
  post: PostData;
  open: boolean;
  onClose: () => void;
}

export default function EditPostDialog({
  post,
  open,
  onClose,
}: EditPostDialogProps) {
  const { user } = useSession();
  const { toast } = useToast();
  const mutation = useEditPostMutation();

  const {
    startUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
    setInitialAttachments,
  } = useMediaUpload();

  // Use a ref to track if we've already initialized attachments
  const initializedRef = useRef(false);

  // Initialize with existing attachments
  useEffect(() => {
    if (open && post.attachments.length && !initializedRef.current && attachments.length === 0) {
      debug.log('EditPostDialog: Initializing attachments');
      initializedRef.current = true;
      setInitialAttachments(post.attachments.map(att => ({
        url: att.url,
        mediaId: att.id,
        type: att.type,
      })));
    }

    // Reset the ref when dialog closes so we can initialize again next time
    if (!open) {
      initializedRef.current = false;
    }
  }, [open, post.attachments]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      Placeholder.configure({
        placeholder: "What's on your mind today?",
      }),
    ],
    content: post.content,
    immediatelyRender: false, // Fix for SSR hydration mismatches
  });

  // Update editor content when post changes or dialog opens
  useEffect(() => {
    if (editor && open) {
      editor.commands.setContent(post.content);
    }
  }, [editor, open, post.content]);

  const input =
    editor?.getText({
      blockSeparator: "\n",
    }) || "";

  function handleOpenChange(open: boolean) {
    if (!open) {
      if (!mutation.isPending) {
        onClose();
        resetMediaUploads();
        editor?.commands.clearContent();
      }
    }
  }

  function onSubmit() {
    // Validate that we have either content or media
    const hasContent = input.trim().length > 0;
    const hasMedia = attachments.length > 0;

    if (!hasContent && !hasMedia) {
      toast({
        variant: "destructive",
        description: "Post must have either text content or media attachments.",
      });
      return;
    }

    // Ensure we're passing plain objects only
    const submitData = {
      id: post.id,
      content: input.trim(),
      mediaIds: attachments
        .map((a) => a.mediaId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    };

    debug.log("Submitting edit with data:", submitData);

    mutation.mutate(submitData, {
      onSuccess: () => {
        onClose();
        resetMediaUploads();
        editor?.commands.clearContent();
      },
    });
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile()) as File[];
    startUpload(files);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex gap-5">
            <div className="w-full">
              <div className="tiptap-editor-content">
                <EditorContent
                  editor={editor}
                  className="min-h-[100px] max-h-[20rem] w-full overflow-y-auto rounded-2xl bg-background px-5 py-3 border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  onPaste={onPaste}
                />
              </div>
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
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={onSubmit}
            loading={mutation.isPending}
            disabled={isUploading}
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    onFilesSelected(files);
    e.target.value = "";
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*, video/*"
        multiple
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        title="Add attachments"
      >
        <ImageIcon className="size-5 text-muted-foreground" />
      </Button>
    </>
  );
}

interface AttachmentPreviewsProps {
  attachments: Array<{
    file: File;
    mediaId?: string;
    isUploading: boolean;
    url?: string;
  }>;
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
        <div
          key={attachment.file.name}
          className="group relative mx-auto size-fit"
        >
          {attachment.url ? (
            attachment.file.type.startsWith("image/") ? (
              <Image
                src={attachment.url}
                alt="Attachment"
                width={500}
                height={500}
                unoptimized={true}
                className="size-fit max-h-[20rem] rounded-2xl"
              />
            ) : (
              <CustomVideoPlayer
                src={attachment.url}
                className="size-fit max-h-[20rem] rounded-2xl"
                autoPlay={false}
                muted={true}
                loop={true}
              />
            )
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-muted rounded-2xl">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <Button
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => removeAttachment(attachment.file.name)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
