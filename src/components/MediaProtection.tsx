'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function MediaProtection() {
  const { toast } = useToast();

  useEffect(() => {
    // Function to prevent context menu only on media elements
    const preventContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only prevent context menu on images and videos
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO' ||
          target.closest('.screenshot-protected')) {
        e.preventDefault();
        return false;
      }
    };

    // Function to prevent keyboard shortcuts for saving content
    const preventSaveShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Cmd+S, Ctrl+P, Cmd+P only when not in form elements
      const target = e.target as HTMLElement;
      const isFormElement = target.tagName === 'INPUT' ||
                           target.tagName === 'TEXTAREA' ||
                           target.isContentEditable;

      if (!isFormElement &&
          (e.ctrlKey || e.metaKey) &&
          (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        return false;
      }

      // Prevent PrintScreen key
      if (e.key === 'PrintScreen') {
        detectScreenshot();
        // Don't prevent default for PrintScreen as it might break other functionality
      }
    };

    // Function to detect screenshots using visibility API
    const detectScreenshot = () => {
      toast({
        title: "Screenshot Detected",
        description: "Taking screenshots of content is not allowed.",
        variant: "destructive",
      });
    };

    // Function to prevent dragging of images
    const preventDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('.screenshot-protected')) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventSaveShortcuts);
    document.addEventListener('dragstart', preventDrag as EventListener);

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventSaveShortcuts);
      document.removeEventListener('dragstart', preventDrag as EventListener);
    };
  }, [toast]);

  // This component doesn't render anything visible
  return null;
}
