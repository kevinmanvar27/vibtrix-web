"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useChatSelection } from "../messages/useChatSelection";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { useSession } from "../SessionProvider";
import { useGuestSession } from "@/components/GuestSessionProvider";

import debug from "@/lib/debug";

interface MessageButtonProps {
  userId: string;
}

// Create a global variable to store a flag to indicate if we should focus the input
let shouldFocusInput = false;

// Create a function to focus the chat input
function focusChatInput() {
  // Wait for the DOM to be updated
  setTimeout(() => {
    // Find the textarea in the chat channel
    const textarea = document.querySelector('.sticky.bottom-0 textarea');
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
      shouldFocusInput = false;
    } else {
      // If the textarea is not found yet, try again in a moment
      if (shouldFocusInput) {
        setTimeout(focusChatInput, 100);
      }
    }
  }, 300);
}

export default function MessageButton({ userId }: MessageButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setSelectedChat } = useChatSelection();
  const { messagingEnabled } = useFeatureSettings();
  const { isLoggedIn } = useSession();
  const { redirectToLogin } = useGuestSession();

  // Effect to focus the input when the component mounts if we should focus the input
  useEffect(() => {
    if (shouldFocusInput) {
      focusChatInput();
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      debug.log("MessageButton - Starting chat with user:", userId);

      try {
        const response = await apiClient.post("/api/chats", {
          participantIds: [userId],
          isGroupChat: false,
        });
        debug.log("MessageButton - Chat creation response:", response.data);
        return response.data;
      } catch (error) {
        debug.error("MessageButton - Error creating chat:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          debug.error("MessageButton - Error response data:", axiosError.response?.data);
          debug.error("MessageButton - Error response status:", axiosError.response?.status);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      debug.log("MessageButton - Chat created successfully, navigating to messages");
      // Store the chat ID in the chat selection hook and set the flag to focus the input
      setSelectedChat((data as any)?.id);
      shouldFocusInput = true;

      // Navigate to the messages page
      router.push("/messages");

      // Focus the input after navigation
      focusChatInput();
    },
    onError: (error: any) => {
      debug.error("MessageButton - Error starting chat:", error);

      let errorMessage = "Error starting chat. Please try again.";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        debug.error("MessageButton - Error message from server:", errorMessage);
      } else if (error instanceof Error) {
        errorMessage = error.message;
        debug.error("MessageButton - Error message:", errorMessage);
      }

      toast({
        variant: "destructive",
        title: "Chat Creation Failed",
        description: errorMessage,
      });
    },
  });

  if (!messagingEnabled) {
    return null;
  }

  const handleClick = () => {
    if (!isLoggedIn) {
      debug.log('MessageButton - User not logged in, redirecting to login');
      toast({
        title: "Sign in required",
        description: "You need to sign in to send messages",
        variant: "default",
      });
      redirectToLogin();
      return;
    }

    debug.log('MessageButton - User logged in, starting chat');
    mutation.mutate();
  };

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      disabled={mutation.isPending}
    >
      <MessageSquare className="mr-2 h-4 w-4" />
      Message
    </Button>
  );
}
