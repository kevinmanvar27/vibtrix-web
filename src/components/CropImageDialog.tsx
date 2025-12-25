import "cropperjs/dist/cropper.css";
import { useRef } from "react";
import { Cropper, ReactCropperElement } from "react-cropper";
import { Button } from "./ui/button";
import debug from "@/lib/debug";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface CropImageDialogProps {
  src: string;
  cropAspectRatio: number;
  onCropped: (blob: Blob | null) => void;
  onClose: () => void;
}

export default function CropImageDialog({
  src,
  cropAspectRatio,
  onCropped,
  onClose,
}: CropImageDialogProps) {
  const cropperRef = useRef<ReactCropperElement>(null);

  function crop() {
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) return;

      // Get cropped canvas with quality options
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            debug.error('Failed to create blob from cropped image');
            onCropped(null);
            return;
          }

          // Check if blob size is within limits (5MB)
          if (blob.size > 5 * 1024 * 1024) {
            debug.warn('Cropped image is too large:', blob.size, 'bytes');
            // We'll still proceed, the server will handle size validation
          }

          onCropped(blob);
        },
        "image/webp",
        0.85 // Compression quality (0-1)
      );

      onClose();
    } catch (error) {
      debug.error('Error during image cropping:', error);
      onCropped(null);
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
        </DialogHeader>
        <Cropper
          src={src}
          aspectRatio={cropAspectRatio}
          guides={false}
          zoomable={false}
          ref={cropperRef}
          className="mx-auto size-fit"
        />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={crop}>Crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
