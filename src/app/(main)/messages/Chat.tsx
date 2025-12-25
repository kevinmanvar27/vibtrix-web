"use client";

import { useEffect, useState } from "react";
import ChatChannel from "./ChatChannel";
import ChatSidebar from "./ChatSidebar";
import { ChatProvider } from "./ChatContext";
import { useChatSelection } from "./useChatSelection";
import { useSession } from "../SessionProvider";
import { useGuestSession } from "@/components/GuestSessionProvider";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import debug from "@/lib/debug";

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { getSelectedChat } = useChatSelection();
  const { isLoggedIn } = useSession();
  const { redirectToLogin } = useGuestSession();

  // Check if there's a selected chat ID from the MessageButton
  useEffect(() => {
    debug.log('Chat component - Checking for selected chat ID');
    const chatId = getSelectedChat();
    debug.log('Chat component - Got selected chat ID:', chatId);
    if (chatId) {
      debug.log('Chat component - Setting selected chat ID:', chatId);
      setSelectedChatId(chatId);
    }
  }, []);

  // Log authentication status
  useEffect(() => {
    debug.log('Chat component - Authentication status:', { isLoggedIn });
  }, [isLoggedIn]);

  // If user is not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] w-full items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Sign in to access messages</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to send and receive messages.
            </p>
            <Button onClick={() => redirectToLogin()} className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ChatProvider>
      <main className="relative w-full overflow-hidden rounded-2xl bg-card shadow-sm">
        <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] w-full">
          <ChatSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            selectedChatId={selectedChatId}
            onSelectChat={(chatId) => {
              setSelectedChatId(chatId);
              setSidebarOpen(false);
            }}
          />
          <ChatChannel
            open={!sidebarOpen}
            openSidebar={() => setSidebarOpen(true)}
            chatId={selectedChatId}
          />
        </div>
      </main>
    </ChatProvider>
  );
}
