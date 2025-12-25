"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Clock } from "lucide-react";
import debug from "@/lib/debug";

// Local storage keys
const PWA_PROMPT_SNOOZED_KEY = "vibtrix_pwa_prompt_snoozed";
const PWA_PROMPT_DISMISSED_KEY = "vibtrix_pwa_prompt_dismissed";
const PWA_PROMPT_SECOND_ATTEMPT_KEY = "vibtrix_pwa_prompt_second_attempt";

export default function PWAInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isSecondAttempt, setIsSecondAttempt] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if the app is running on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };

    // Check on mount and on resize
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Check if the app is already installed as a PWA
  const isAppInstalled = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  };

  // Check if the prompt has been snoozed or dismissed
  const isPromptSnoozed = () => {
    try {
      const snoozedUntil = localStorage.getItem(PWA_PROMPT_SNOOZED_KEY);
      if (snoozedUntil) {
        const snoozedTime = parseInt(snoozedUntil, 10);
        return Date.now() < snoozedTime;
      }
      return false;
    } catch (error) {
      debug.error("Error checking if prompt is snoozed:", error);
      return false;
    }
  };

  const isPromptDismissed = () => {
    try {
      return localStorage.getItem(PWA_PROMPT_DISMISSED_KEY) === "true";
    } catch (error) {
      debug.error("Error checking if prompt is dismissed:", error);
      return false;
    }
  };

  // Check if this is the second attempt
  const checkSecondAttempt = () => {
    try {
      const secondAttempt = localStorage.getItem(PWA_PROMPT_SECOND_ATTEMPT_KEY);
      setIsSecondAttempt(secondAttempt === "true");
    } catch (error) {
      debug.error("Error checking if second attempt:", error);
    }
  };

  // Set up the beforeinstallprompt event handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e);
      debug.log("Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Show the prompt immediately if conditions are met
  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) return;

    // Don't show if already installed
    if (isAppInstalled()) {
      debug.log("App is already installed as PWA");
      return;
    }

    // Check if this is the second attempt
    checkSecondAttempt();

    // Don't show if permanently dismissed
    if (isPromptDismissed()) {
      debug.log("PWA prompt was permanently dismissed");
      return;
    }

    // Don't show if snoozed
    if (isPromptSnoozed()) {
      debug.log("PWA prompt is snoozed");

      // Set up a timer to show the prompt again when the snooze period ends
      const snoozedUntil = parseInt(localStorage.getItem(PWA_PROMPT_SNOOZED_KEY) || "0", 10);
      const timeToWait = Math.max(0, snoozedUntil - Date.now());

      promptTimeoutRef.current = setTimeout(() => {
        // Mark as second attempt
        localStorage.setItem(PWA_PROMPT_SECOND_ATTEMPT_KEY, "true");
        setIsSecondAttempt(true);
        setIsOpen(true);
        debug.log("Showing PWA install prompt after snooze period");
      }, timeToWait);

      return;
    }

    // Show the prompt immediately
    setIsOpen(true);
    debug.log("Showing PWA install prompt immediately");

    return () => {
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
      }
    };
  }, [isMobile]);

  // Handle the install button click
  const handleInstall = async () => {
    if (!deferredPrompt) {
      debug.log("No install prompt available");

      // If no prompt is available, provide instructions
      alert("To install this app on your home screen: tap the browser menu button and select 'Add to Home Screen' or 'Install App'.");
      setIsOpen(false);
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        debug.log('User accepted the install prompt');
        // Clear all PWA prompt related storage
        localStorage.removeItem(PWA_PROMPT_SNOOZED_KEY);
        localStorage.removeItem(PWA_PROMPT_SECOND_ATTEMPT_KEY);
        localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, "true"); // Mark as dismissed after successful install
      } else {
        debug.log('User dismissed the install prompt');
      }

      // Clear the saved prompt
      setDeferredPrompt(null);
      setIsOpen(false);
    } catch (error) {
      debug.error("Error showing install prompt:", error);
    }
  };

  // Handle the remind me later button click
  const handleRemindLater = () => {
    try {
      // Snooze for 5 minutes (300000 milliseconds)
      const snoozeUntil = Date.now() + 300000; // 5 minutes
      localStorage.setItem(PWA_PROMPT_SNOOZED_KEY, snoozeUntil.toString());
      debug.log("PWA prompt snoozed for 5 minutes");
      setIsOpen(false);
    } catch (error) {
      debug.error("Error snoozing prompt:", error);
    }
  };

  // Handle the maybe later button click (for second attempt)
  const handleMaybeLater = () => {
    try {
      // Permanently dismiss the prompt
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, "true");
      debug.log("PWA prompt permanently dismissed");
      setIsOpen(false);
    } catch (error) {
      debug.error("Error dismissing prompt:", error);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install Vibtrix App</DialogTitle>
          <DialogDescription>
            {isSecondAttempt
              ? "Enjoy a faster, app-like experience! Install the app for quicker access, offline support, and push notifications."
              : "Install our app on your device for a better experience with faster loading and offline access."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <div className="rounded-lg bg-muted p-2 flex items-center justify-center">
            <Download className="h-10 w-10 text-primary" />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {isSecondAttempt ? (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleMaybeLater}
            >
              <Clock className="h-4 w-4" />
              Maybe Later
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleRemindLater}
            >
              <Clock className="h-4 w-4" />
              Remind Me Later
            </Button>
          )}
          <Button
            className="flex items-center gap-2"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
