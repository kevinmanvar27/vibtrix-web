"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";
import apiClient from "@/lib/api-client";
import { ChatData, MessageData, MessagesPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { messageContainsPostLink, getFirstPostIdFromMessage } from "@/lib/message-utils";
import PostLinkPreview from "@/components/messages/PostLinkPreview";
import Linkify from "@/components/Linkify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Menu, Send, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "../SessionProvider";
import { addMessageToCache, useChatContext } from "./ChatContext";
import { useGuestSession } from "@/components/GuestSessionProvider";

import debug from "@/lib/debug";

interface ChatChannelProps {
  open: boolean;
  openSidebar: () => void;
  chatId: string | null;
}

export default function ChatChannel({ open, openSidebar, chatId }: ChatChannelProps) {
  const { user, isLoggedIn } = useSession();
  const { redirectToLogin } = useGuestSession();
  const queryClient = useQueryClient();
  const { refreshMessages } = useChatContext();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authError, setAuthError] = useState(false);

  // Log component props and state
  useEffect(() => {
    debug.log('ChatChannel - Component props:', { open, chatId });
    debug.log('ChatChannel - Authentication status:', { isLoggedIn, user });
  }, [open, chatId, isLoggedIn, user]);

  // Fetch chat details
  const {
    data: chat,
    isLoading: isChatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      if (!chatId) return null;
      if (typeof window === 'undefined') return null;

      debug.log(`ChatChannel - Fetching chat details for chatId: ${chatId}`);
      try {
        // If not logged in, don't even try to fetch
        if (!isLoggedIn) {
          debug.log('ChatChannel - Not logged in, setting auth error');
          setAuthError(true);
          return null;
        }

        debug.log('ChatChannel - Making API request to fetch chat details');
        const response = await fetch(`/api/chats/${chatId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          debug.error('ChatChannel - Error response from API:', { status: response.status, data: errorData });
          if (response.status === 401) {
            debug.log('ChatChannel - Unauthorized (401), setting auth error');
            setAuthError(true);
          }
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        const data = await response.json();
        debug.log(`ChatChannel - Chat details fetched successfully:`, data);
        return data as ChatData;
      } catch (error) {
        debug.error(`ChatChannel - Error fetching chat details:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('Unauthorized') || errorMessage?.includes('401')) {
          debug.log('ChatChannel - Auth error detected in error message, setting auth error');
          setAuthError(true);
        }
        throw error;
      }
    },
    enabled: !!chatId && typeof window !== 'undefined',
    retry: 1,
  });

  // Fetch messages
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId) return { messages: [], previousCursor: null };
      if (typeof window === 'undefined') return { messages: [], previousCursor: null };

      debug.log(`Fetching messages for chatId: ${chatId}`);
      try {
        // If not logged in, don't even try to fetch
        if (!isLoggedIn) {
          setAuthError(true);
          return { messages: [], previousCursor: null };
        }

        const response = await fetch(`/api/chats/${chatId}/messages`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            setAuthError(true);
          }
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        debug.log(`Messages fetched successfully, count:`, data.messages?.length);
        return data as MessagesPage;
      } catch (error) {
        debug.error("Error fetching messages:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('Unauthorized') || errorMessage?.includes('401')) {
          setAuthError(true);
        }
        return { messages: [], previousCursor: null };
      }
    },
    initialData: { messages: [], previousCursor: null },
    enabled: !!chatId && typeof window !== 'undefined',
    refetchInterval: 3000, // Simplified polling strategy - every 3 seconds
    retry: 1,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId) throw new Error("No chat selected");
      if (!content.trim()) throw new Error("Message cannot be empty");

      debug.log(`Sending message to chatId: ${chatId}`);
      try {
        // Use fetch for better debugging
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        debug.log(`Message sent successfully:`, data);
        return data as MessageData;
      } catch (error) {
        debug.error("Error sending message:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again."
        );
      }
    },
    onSuccess: (newMessage) => {
      if (!chatId) return;
      try {
        // Add the new message to the cache
        addMessageToCache(queryClient, chatId, newMessage);
        // Refresh unread count for other users
        queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
      } catch (cacheError) {
        debug.error("Error updating cache after message send:", cacheError);
        // Still consider the operation successful even if cache update fails
      }
    },
    onError: (error) => {
      debug.error("Message sending error:", error);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later",
      });
    },
  });

  // Scroll to bottom when new messages arrive or when the chat is loaded
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use a small timeout to ensure DOM is fully updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messagesData?.messages.length, chatId]);

  // Also scroll to bottom when sending a message
  useEffect(() => {
    if (sendMessageMutation.isPending && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sendMessageMutation.isPending]);

  // Scroll to bottom immediately when chat changes (without smooth scrolling)
  useEffect(() => {
    if (messagesEndRef.current && chatId) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatId]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;

    const trimmedMessage = messageText.trim();
    setMessageText(""); // Clear input immediately for better UX

    sendMessageMutation.mutate(trimmedMessage, {
      onError: () => {
        // If there's an error, restore the message text so the user doesn't lose their input
        setMessageText(trimmedMessage);
      }
    });
  };

  // Handle pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get other participant for direct chats (with null checks)
  const otherParticipant = chat && !chat.isGroupChat && Array.isArray(chat.participants)
    ? chat.participants.find((p) => p && p.userId !== (user?.id || ''))?.user
    : null;

  // Get chat name
  const chatName = chat
    ? chat.isGroupChat
      ? chat.name
      : otherParticipant?.displayName || "Unknown"
    : "";

  return (
    <div className={cn("flex h-full w-full flex-col", !open && "hidden")}>
      {!isLoggedIn || authError ? (
        <div className="flex flex-col h-full items-center justify-center p-4">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Sign in to view and send messages
          </p>
          <Button
            onClick={() => redirectToLogin(window.location.href)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in to interact
          </Button>
        </div>
      ) : !chatId ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Select a chat to start messaging</p>
        </div>
      ) : (
        <>
          {/* Sticky chat header */}
          <div className="sticky top-0 z-10 flex items-center border-b bg-card p-3 shadow-sm">
            <div className="md:hidden">
              <Button size="icon" variant="ghost" onClick={openSidebar}>
                <Menu className="size-5" />
              </Button>
            </div>
            <div className="flex items-center gap-3 px-2">
              {chat?.isGroupChat ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-medium">
                    {chatName?.substring(0, 2).toUpperCase() || "GC"}
                  </span>
                </div>
              ) : (
                <UserAvatar
                  avatarUrl={otherParticipant?.avatarUrl}
                  showStatus={false}
                />
              )}
              <div>
                <h3 className="font-medium">{chatName}</h3>
                {!chat?.isGroupChat && otherParticipant?.username && (
                  <Link
                    href={`/users/${otherParticipant.username}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    @{otherParticipant.username}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable messages area */}
          <div className="flex-1 overflow-y-auto p-4">
            {isMessagesLoading || isChatLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messagesData.messages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              <>
                {/* Pagination removed for simplicity */}

                <div className="space-y-4">
                  {messagesData.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={message.sender.id === (user?.id || '')}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>

          {/* Sticky message input at bottom */}
          <div className="sticky bottom-0 border-t bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <textarea
                className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Type a message..."
                rows={1}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: MessageData;
  isOwnMessage: boolean;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  // Check if the message contains a post link
  const hasPostLink = messageContainsPostLink(message.content);
  const postId = hasPostLink ? getFirstPostIdFromMessage(message.content) : null;

  return (
    <div
      className={cn(
        "flex",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {!isOwnMessage && (
          <Link
            href={`/users/${message.sender.username}`}
            className="mb-1 block text-xs font-medium hover:underline"
          >
            {message.sender.displayName}
          </Link>
        )}
        <div className="whitespace-pre-wrap break-words">
          <Linkify>{message.content}</Linkify>
        </div>

        {/* Display post preview if message contains a post link */}
        {postId && (
          <PostLinkPreview postId={postId} />
        )}

        <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-70">
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>
          {isOwnMessage && (
            <span className="ml-1">
              {message.isRead ? (
                <span title="Read" className="text-blue-400">✓✓</span>
              ) : (
                <span title="Sent">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
