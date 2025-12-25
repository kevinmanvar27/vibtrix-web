import { useToast } from "@/components/ui/use-toast";
import { useState, useCallback, useRef, useEffect } from "react";

import debug from "@/lib/debug";

export interface Attachment {
  file: File;
  mediaId?: string;
  isUploading: boolean;
  url?: string;
}

// Memoize options to prevent unnecessary re-renders
const useStableOptions = (options?: { isCompetitionEntry?: boolean; competitionId?: string }) => {
  const stableOptions = useRef(options);

  // Only update the ref if the options have changed
  useEffect(() => {
    if (options?.competitionId !== stableOptions.current?.competitionId ||
        options?.isCompetitionEntry !== stableOptions.current?.isCompetitionEntry) {
      stableOptions.current = options;
    }
  }, [options]);

  return stableOptions.current;
};

export default function useMediaUpload(options?: { isCompetitionEntry?: boolean; competitionId?: string }) {
  // Stabilize options to prevent unnecessary re-renders
  const stableOptions = useStableOptions(options);
  const { toast } = useToast();

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [uploadProgress, setUploadProgress] = useState<number>();

  const [isUploading, setIsUploading] = useState(false);

  const handleStartUpload = useCallback(async (files: File[]) => {
    debug.log(`MediaUpload: Starting upload of ${files.length} files, isCompetitionEntry=${stableOptions?.isCompetitionEntry || false}`);

    if (isUploading) {
      debug.log('MediaUpload: Upload already in progress');
      toast({
        variant: "destructive",
        description: "Please wait for the current upload to finish.",
      });
      return;
    }

    // Reset upload progress
    setUploadProgress(undefined);

    // Validate files
    if (!files.length) {
      debug.log('MediaUpload: No files provided');
      toast({
        variant: "destructive",
        description: "No files selected for upload.",
      });
      return;
    }

    // For competition entries, only allow one file
    const maxFiles = stableOptions?.isCompetitionEntry ? 1 : 5;
    const maxFilesMessage = stableOptions?.isCompetitionEntry
      ? "You can only upload 1 file for a competition entry."
      : "You can only upload up to 5 attachments per post.";

    debug.log(`MediaUpload: Current attachments: ${attachments.length}, max allowed: ${maxFiles}`);

    if (attachments.length + files.length > maxFiles) {
      debug.log(`MediaUpload: Too many files (${attachments.length + files.length}/${maxFiles});`);
      toast({
        variant: "destructive",
        description: maxFilesMessage,
      });
      return;
    }

    // Log file details
    files.forEach((file, index) => {
      debug.log(`MediaUpload: File ${index + 1} - name: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    });

    try {
      debug.log('MediaUpload: Setting upload state to true');
      setIsUploading(true);

      // Add files to attachments as uploading
      debug.log('MediaUpload: Preparing files for upload');
      const filesToUpload = files.map((file) => {
        // Ensure the file has a valid extension
        let extension = file.name.split(".").pop() || '';
        if (!extension) {
          // If no extension, try to derive from mime type
          if (file.type.startsWith('image/')) {
            const mimeSubtype = file.type.split('/')[1];
            extension = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype;
          } else if (file.type.startsWith('video/')) {
            extension = file.type.split('/')[1];
          } else {
            extension = 'bin'; // Default binary extension
          }
        }

        const newFileName = `attachment_${crypto.randomUUID()}.${extension}`;
        debug.log(`MediaUpload: Renamed file from ${file.name} to ${newFileName}`);
        return new File(
          [file],
          newFileName,
          {
            type: file.type,
          },
        );
      });

      debug.log('MediaUpload: Adding files to attachments state');
      setAttachments((prev) => [
        ...prev,
        ...filesToUpload.map((file) => ({ file, isUploading: true })),
      ]);

      // Create form data
      debug.log('MediaUpload: Creating FormData');
      const formData = new FormData();
      filesToUpload.forEach((file) => {
        formData.append('files', file);
        debug.log(`MediaUpload: Added ${file.name} to FormData`);
      });

      // Add competition-related flags if needed
      if (stableOptions?.isCompetitionEntry) {
        debug.log('MediaUpload: Adding competition entry flag to FormData');
        formData.append('isCompetitionEntry', 'true');

        // Add competitionId if available
        if (stableOptions?.competitionId) {
          debug.log(`MediaUpload: Adding competitionId ${stableOptions.competitionId} to FormData`);
          formData.append('competitionId', stableOptions.competitionId);
        } else {
          debug.log('MediaUpload: Warning - Competition entry without competitionId');
        }
      }

      // Upload progress simulation (since fetch doesn't support progress)
      debug.log('MediaUpload: Starting upload progress simulation');
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === undefined) return 10;
          if (prev >= 90) return 90;
          return prev + 10;
        });
      }, 300);

      // Upload files
      debug.log('MediaUpload: Sending request to /api/upload');
      let response;
      try {
        // Add competition information to the form data if this is a competition entry
        if (stableOptions?.isCompetitionEntry) {
          formData.append('isCompetitionEntry', 'true');
          if (stableOptions?.competitionId) {
            formData.append('competitionId', stableOptions.competitionId);
            debug.log(`MediaUpload: Added competitionId ${stableOptions.competitionId} to FormData`);
          } else {
            debug.error('MediaUpload: WARNING - Competition entry without competitionId');
          }
        }

        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        debug.log(`MediaUpload: Response received, status: ${response.status}`);
      } catch (fetchError) {
        debug.error('MediaUpload: Network error during fetch:', fetchError);
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(undefined);

        // Update attachments to mark them as failed
        setAttachments(prev => prev.map(attachment => {
          if (attachment.isUploading) {
            return { ...attachment, isUploading: false, error: true };
          }
          return attachment;
        }));

        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Network error while uploading. Please check your connection and try again."
        });
        return;
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      debug.log('MediaUpload: Upload progress set to 100%');

      if (!response.ok) {
        clearInterval(progressInterval);
        setIsUploading(false);
        setUploadProgress(undefined);

        // Update attachments to mark them as failed
        setAttachments(prev => prev.map(attachment => {
          if (attachment.isUploading) {
            return { ...attachment, isUploading: false, error: true };
          }
          return attachment;
        }));

        try {
          const errorData = await response.json();
          debug.error('MediaUpload: Server error:', errorData);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: errorData.error || 'Failed to upload files'
          });
        } catch (e) {
          debug.error('MediaUpload: Failed to parse error response:', e);
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: `Server error: ${response.status}`
          });
        }
        return;
      }

      let result;
      try {
        // First check if the response has content
        const responseText = await response.text();
        debug.log('MediaUpload: Response text:', responseText);

        if (!responseText || responseText.trim() === '') {
          debug.error('MediaUpload: Empty response received from server');
          throw new Error('Server returned an empty response');
        }

        try {
          // Now parse the text as JSON
          result = JSON.parse(responseText);
          debug.log('MediaUpload: Successfully parsed response:', result);
        } catch (parseError) {
          debug.error('MediaUpload: Failed to parse JSON:', parseError, 'Response was:', responseText);
          throw new Error('Server returned invalid JSON');
        }
      } catch (jsonError) {
        debug.error('MediaUpload: Failed to process response:', jsonError);

        // Update attachments to mark them as failed
        setAttachments(prev => prev.map(attachment => {
          if (attachment.isUploading) {
            return { ...attachment, isUploading: false, error: true };
          }
          return attachment;
        }));

        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: jsonError instanceof Error ? jsonError.message : 'Failed to process server response'
        });

        setIsUploading(false);
        setUploadProgress(undefined);
        return;
      }

      if (!result.files || !Array.isArray(result.files)) {
        debug.error('MediaUpload: Invalid response format, missing files array:', result);
        throw new Error('Invalid server response format');
      }

      // Update attachments with media IDs and URLs
      debug.log(`MediaUpload: Updating attachments with ${result.files.length} media IDs`);
      setAttachments((prev) =>
        prev.map((a) => {
          if (!a.isUploading) {
            // Skip attachments that aren't being uploaded
            return a;
          }

          // For competition entries, we only have one file, so just use the first result
          const uploadResult = stableOptions?.isCompetitionEntry
            ? result.files[0]
            : result.files.find((r) => r.name === a.file.name);

          if (!uploadResult) {
            debug.log(`MediaUpload: No upload result found for ${a.file.name}`);
            return { ...a, isUploading: false, error: true };
          }

          debug.log(`MediaUpload: Found media ID ${uploadResult.mediaId} for ${a.file.name}`);
          debug.log(`MediaUpload: URL for ${a.file.name}: ${uploadResult.url}`);

          return {
            ...a,
            mediaId: uploadResult.mediaId,
            url: uploadResult.url,  // Add the URL from the server response
            isUploading: false,
          };
        }),
      );
      debug.log('MediaUpload: Attachments updated successfully');
    } catch (error) {
      debug.error('MediaUpload: Error during upload process:', error);

      // Remove any attachments that were in the uploading state
      debug.log('MediaUpload: Removing attachments that were being uploaded');
      setAttachments((prev) => {
        const filtered = prev.filter((a) => !a.isUploading);
        debug.log(`MediaUpload: Removed ${prev.length - filtered.length} attachments`);
        return filtered;
      });

      // Show error toast with detailed message
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      debug.log(`MediaUpload: Showing error toast: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: errorMessage,
      });
    } finally {
      debug.log('MediaUpload: Setting upload state to false');
      setIsUploading(false);
      setUploadProgress(undefined);
    }
  }, [attachments.length, isUploading, stableOptions, toast]);

  // Use a ref to track if we've already initialized attachments
  const initializedRef = useRef(false);

  const removeAttachment = useCallback((fileName: string) => {
    setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
  }, []);

  const reset = useCallback(() => {
    setAttachments([]);
    setUploadProgress(undefined);
    initializedRef.current = false;
  }, []);

  // Function to set initial attachments from existing media
  const setInitialAttachments = useCallback((initialMedia: Array<{ url: string, mediaId: string, type: string }>) => {
    // Prevent duplicate initialization
    if (initializedRef.current) {
      debug.log('MediaUpload: Initial attachments already set, skipping');
      return;
    }

    debug.log('MediaUpload: Setting initial attachments');
    initializedRef.current = true;

    // Create File objects from URLs
    const attachmentsWithFiles = initialMedia.map(media => {
      // Create a placeholder File object
      const fileType = media.type === 'IMAGE' ? 'image/jpeg' : 'video/mp4';
      const fileName = `existing_${media.mediaId}.${fileType.split('/')[1]}`;
      const file = new File([
        // Empty blob as we don't need the actual file content
        new Blob([], { type: fileType })
      ], fileName, { type: fileType });

      return {
        file,
        mediaId: media.mediaId,
        isUploading: false,
        url: media.url
      };
    });

    setAttachments(attachmentsWithFiles);
  }, []);

  return {
    startUpload: handleStartUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset,
    setInitialAttachments,
  };
}
