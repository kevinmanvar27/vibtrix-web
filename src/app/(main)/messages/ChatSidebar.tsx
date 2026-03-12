"use client";

import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { ChatData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Edit, Loader2, MessageSquare, Inbox } from "lucide-react";
import { useState } from "react";
import { useSession } from "../SessionProvider";
import NewChatDialog from "./NewChatDialog";
import MessageRequestsPanel from "./MessageRequestsPanel";
import { useChatContext } from "./ChatContext";

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function ChatSidebar({
  open,
  onClose,
  selectedChatId,
  onSelectChat,
}: ChatSidebarProps) {
  const { user } = useSession();
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const { refreshChats } = useChatContext();

  // Fetch chats
  const { data, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await fetch("/api/chats");
      if (!response.ok) throw new Error("Failed to fetch chats");
      return response.json() as Promise<{ chats: ChatData[]; nextCursor: string | null }>;
    },
    refetchInterval: 10000,
  });

  // Fetch pending message requests count
  const { data: requestsData } = useQuery({
    queryKey: ["message-requests"],
    queryFn: async () => {
      const response = await fetch("/api/message-requests");
      if (!response.ok) throw new Error("Failed to fetch message requests");
      return response.json() as Promise<{ requests: any[] }>;
    },
    refetchInterval: 15000,
  });

  const chats = data?.chats || [];
  const pendingRequestsCount = requestsData?.requests?.length || 0;

  if (showRequests) {
    return (
      <MessageRequestsPanel
        open={open}
        onBack={() => setShowRequests(false)}
        onChatAccepted={(chatId) => {
          setShowRequests(false);
          onSelectChat(chatId);
          refreshChats();
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        // On mobile: show only when open=true. On desktop: always show.
        "flex h-full w-full flex-col border-r bg-card md:w-80",
        !open && "hidden md:flex"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Messages</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowNewChatDialog(true)}
          title="New chat"
        >
          <Edit className="size-5" />
        </Button>
      </div>

      {/* Message Requests Banner */}
      {pendingRequestsCount > 0 && (
        <button
          onClick={() => setShowRequests(true)}
          className="flex items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Inbox className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Message Requests</p>
            <p className="text-xs text-muted-foreground">
              {pendingRequestsCount} pending request{pendingRequestsCount !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
            {pendingRequestsCount}
          </span>
        </button>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <MessageSquare className="size-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewChatDialog(true)}
            >
              Start a chat
            </Button>
          </div>
        ) : (
          <ul>
            {chats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentUserId={user?.id || ""}
                isSelected={chat.id === selectedChatId}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {showNewChatDialog && (
        <NewChatDialog
          onOpenChange={setShowNewChatDialog}
          onChatCreated={() => {
            setShowNewChatDialog(false);
            refreshChats();
          }}
        />
      )}
    </div>
  );
}

interface ChatItemProps {
  chat: ChatData;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

function ChatItem({ chat, currentUserId, isSelected, onClick }: ChatItemProps) {
  const otherParticipant =
    !chat.isGroupChat && Array.isArray(chat.participants)
      ? chat.participants.find((p) => p?.userId !== currentUserId)?.user
      : null;

  const chatName = chat.isGroupChat
    ? chat.name || "Group Chat"
    : otherParticipant?.displayName || "Unknown";

  const lastMessage = chat.messages?.[0];
  const lastMessageText = lastMessage?.content
    ? lastMessage.content.length > 40
      ? lastMessage.content.substring(0, 40) + "..."
      : lastMessage.content
    : "No messages yet";

  const lastMessageTime = lastMessage?.createdAt
    ? format(new Date(lastMessage.createdAt), "HH:mm")
    : "";

  // Check if there are unread messages for current user
  const hasUnread = Array.isArray(chat.participants)
    ? chat.participants.find((p) => p?.userId === currentUserId)?.hasUnread
    : false;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
          isSelected && "bg-muted"
        )}
      >
        {chat.isGroupChat ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-medium">
              {chatName.substring(0, 2).toUpperCase()}
            </span>
          </div>
        ) : (
          <UserAvatar
            avatarUrl={otherParticipant?.avatarUrl}
            showStatus={false}
            className="shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className={cn("truncate text-sm", hasUnread ? "font-bold" : "font-medium")}>
              {chatName}
            </p>
            {lastMessageTime && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {lastMessageTime}
              </span>
            )}
          </div>
          <p
            className={cn(
              "truncate text-xs",
              hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {lastMessageText}
          </p>
        </div>
        {hasUnread && (
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </button>
    </li>
  );
}
