"use client";

import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import apiClient from "@/lib/api-client";
import { ChatData, ChatsPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { messageContainsPostLink } from "@/lib/message-utils";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, MailPlus, Search, X, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "../SessionProvider";
import { useChatContext } from "./ChatContext";
import NewChatDialog from "./NewChatDialog";
import { useGuestSession } from "@/components/GuestSessionProvider";
import { OnlineStatus } from "@/lib/types/onlineStatus";

import debug from "@/lib/debug";

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
  onSelectChat
}: ChatSidebarProps) {
  const { user, isLoggedIn } = useSession();
  const { redirectToLogin } = useGuestSession();
  const { refreshChats } = useChatContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [authError, setAuthError] = useState(false);

  // Log component props and state
  useEffect(() => {
    debug.log('ChatSidebar - Component props:', { open, selectedChatId });
    debug.log('ChatSidebar - Authentication status:', { isLoggedIn, user });
  }, [open, selectedChatId, isLoggedIn, user]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["chats"],
    queryFn: async ({ pageParam }) => {
      debug.log('ChatSidebar - Fetching chats list');
      try {
        // If not logged in, don't even try to fetch
        if (!isLoggedIn) {
          debug.log('ChatSidebar - Not logged in, setting auth error');
          setAuthError(true);
          return { chats: [], nextCursor: null };
        }

        debug.log('ChatSidebar - Making API request to fetch chats');
        const response = await fetch(`/api/chats${pageParam ? `?cursor=${pageParam}` : ''}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          debug.error('ChatSidebar - Error response from API:', { status: response.status, data: errorData });
          if (response.status === 401) {
            debug.log('ChatSidebar - Unauthorized (401), setting auth error');
            setAuthError(true);
          }
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        debug.log('ChatSidebar - Chats fetched successfully, count:', data.chats?.length);
        return data as ChatsPage;
      } catch (error) {
        debug.error('ChatSidebar - Error fetching chats:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('Unauthorized') || errorMessage?.includes('401')) {
          debug.log('ChatSidebar - Auth error detected in error message, setting auth error');
          setAuthError(true);
        }
        return { chats: [], nextCursor: null };
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchInterval: 3000, // Refetch every 3 seconds
    staleTime: 0, // Consider data stale immediately
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  // Flatten the pages of chats and filter out any invalid entries
  const chats = data?.pages
    ? data.pages
      .filter(page => page && Array.isArray(page.chats))
      .flatMap(page => page.chats.filter(chat => chat && typeof chat === 'object'))
    : [];

  // Filter chats by search query with safety checks
  const filteredChats = searchQuery
    ? chats.filter((chat) => {
      try {
        // For group chats, search in the name
        if (chat.isGroupChat && chat.name) {
          return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        // For direct chats, search in the other participant's name
        if (Array.isArray(chat.participants)) {
          const otherParticipant = chat.participants.find(
            (p) => p && p.userId !== (user?.id || '')
          );
          if (otherParticipant && otherParticipant.user) {
            const displayName = otherParticipant.user.displayName || '';
            const username = otherParticipant.user.username || '';
            const searchLower = searchQuery.toLowerCase();

            return (
              displayName.toLowerCase().includes(searchLower) ||
              username.toLowerCase().includes(searchLower)
            );
          }
        }
        return false;
      } catch (error) {
        debug.error("Error filtering chat:", error);
        return false;
      }
    })
    : chats;

  return (
    <div
      className={cn(
        "size-full flex-col border-e md:flex md:w-72",
        open ? "flex" : "hidden",
      )}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card shadow-sm">
        <MenuHeader onClose={onClose} />

        <div className="relative p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Scrollable chat list */}
      <div className="flex-1 overflow-y-auto">
        {!isLoggedIn || authError ? (
          <div className="flex flex-col h-32 items-center justify-center p-4">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Sign in to view your messages
            </p>
            <Button
              onClick={() => redirectToLogin(window.location.href)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to interact
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? "No chats found" : "No chats yet"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <ChatPreview
                key={chat.id}
                chat={chat}
                currentUserId={user?.id || ''}
                isSelected={chat.id === selectedChatId}
                onClick={() => onSelectChat(chat.id)}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="p-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface MenuHeaderProps {
  onClose: () => void;
}

function MenuHeader({ onClose }: MenuHeaderProps) {
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const { refreshChats } = useChatContext();
  const { isLoggedIn } = useSession();
  const { redirectToLogin } = useGuestSession();

  // Log component state
  useEffect(() => {
    debug.log('MenuHeader - Authentication status:', { isLoggedIn });
    debug.log('MenuHeader - Dialog state:', { showNewChatDialog });
  }, [isLoggedIn, showNewChatDialog]);

  return (
    <>
      <div className="flex items-center gap-3 p-2">
        <div className="h-full md:hidden">
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <h1 className="me-auto text-xl font-bold md:ms-2">Messages</h1>
        <Button
          size="icon"
          variant="ghost"
          title="Start new chat"
          onClick={() => isLoggedIn ? setShowNewChatDialog(true) : redirectToLogin(window.location.href)}
        >
          <MailPlus className="size-5" />
        </Button>
      </div>
      {showNewChatDialog && (
        <NewChatDialog
          onOpenChange={setShowNewChatDialog}
          onChatCreated={() => {
            setShowNewChatDialog(false);
            onClose();
            refreshChats();
          }}
        />
      )}
    </>
  );
}

interface ChatPreviewProps {
  chat: ChatData;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

function ChatPreview({ chat, currentUserId, isSelected, onClick }: ChatPreviewProps) {
  // Safely check if chat and its properties exist
  if (!chat || !Array.isArray(chat.participants)) {
    return null; // Don't render anything if chat data is invalid
  }

  // For direct chats, get the other participant
  const otherParticipantRecord = !chat.isGroupChat
    ? chat.participants.find((p) => p && p.userId !== currentUserId)
    : null;
  const otherParticipant = otherParticipantRecord?.user;

  // Get the current user's participant record to check for unread messages
  const currentUserParticipant = chat.participants.find(
    (p) => p && p.userId === currentUserId
  );

  // Get the chat name (group name or other participant's name)
  const chatName = chat.isGroupChat
    ? chat.name
    : otherParticipant?.displayName || "Unknown";

  // Get the last message (safely)
  const lastMessage = Array.isArray(chat.messages) && chat.messages.length > 0
    ? chat.messages[0]
    : null;

  return (
    <button
      className={cn(
        "w-full px-3 py-3 text-left transition-colors hover:bg-muted/50",
        isSelected && "bg-muted",
        currentUserParticipant?.hasUnread && "bg-primary/5"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {chat.isGroupChat ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-medium">
              {chatName?.substring(0, 2).toUpperCase() || "GC"}
            </span>
          </div>
        ) : (
          <UserAvatar
            avatarUrl={otherParticipant?.avatarUrl}
            showStatus={otherParticipant?.showOnlineStatus}
            status={otherParticipant?.onlineStatus as OnlineStatus}
            statusSize="sm"
          />
        )}

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="truncate font-medium">{chatName}</p>
            {lastMessage && lastMessage.createdAt && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(lastMessage.createdAt), "HH:mm")}
              </p>
            )}
          </div>

          {lastMessage && lastMessage.content && (
            <p
              className={cn(
                "truncate text-sm text-muted-foreground",
                currentUserParticipant?.hasUnread && "font-medium text-foreground"
              )}
            >
              {lastMessage.sender?.id === currentUserId ? "You: " : ""}
              {messageContainsPostLink(lastMessage.content) ? (
                <span className="flex items-center gap-1">
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  Shared a post
                </span>
              ) : (
                lastMessage.content
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
