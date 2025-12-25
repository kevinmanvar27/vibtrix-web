"use client";

import apiClient from "@/lib/api-client";
import { ChatData, MessageData } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useContext, useEffect } from "react";

import debug from "@/lib/debug";

interface ChatContextType {
  refreshChats: () => void;
  refreshMessages: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const queryClient = useQueryClient();

  const refreshChats = useCallback(() => {
    debug.log('ChatContext - Refreshing chats');
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
  }, [queryClient]);

  const refreshMessages = useCallback((chatId: string) => {
    debug.log(`ChatContext - Refreshing messages for chat: ${chatId}`);
    queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    refreshChats();
  }, [queryClient, refreshChats]);

  // Set up optimized polling for new messages
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Initial polling interval
    let pollingInterval = 5000; // Start with 5 seconds (increased from 3s)
    const maxPollingInterval = 30000; // Max 30 seconds (increased from 10s)

    // Set up the polling with setTimeout instead of setInterval
    // This ensures we don't have overlapping requests
    let timeoutId: NodeJS.Timeout | null = null;
    let inactivityTimerId: NodeJS.Timeout | null = null;
    let lastActivityTime = Date.now();
    let isTabActive = !document.hidden;

    // Function to perform the actual polling
    const pollForMessages = () => {
      // Only poll if the tab is active or if it's been less than 2 minutes since last activity
      const shouldPoll = isTabActive || (Date.now() - lastActivityTime < 120000);

      if (shouldPoll) {
        refreshChats();
      }

      // Calculate next interval based on activity and tab visibility
      const nextInterval = calculateNextInterval();

      // Schedule next poll
      timeoutId = setTimeout(pollForMessages, nextInterval);
    };

    // Calculate the appropriate polling interval based on user activity and tab visibility
    const calculateNextInterval = () => {
      const timeSinceActivity = Date.now() - lastActivityTime;

      // If tab is not active, use longer interval
      if (!isTabActive) {
        return maxPollingInterval;
      }

      // If user has been inactive for more than 1 minute, use longer interval
      if (timeSinceActivity > 60000) {
        return maxPollingInterval;
      }

      // If user has been inactive for more than 30 seconds, use medium interval
      if (timeSinceActivity > 30000) {
        return Math.min(pollingInterval * 2, maxPollingInterval);
      }

      // Otherwise use the current polling interval
      return pollingInterval;
    };

    // Reset polling interval on user activity
    const handleUserActivity = () => {
      lastActivityTime = Date.now();

      // Only reset the polling interval if it's not already at the minimum
      if (pollingInterval !== 5000) {
        pollingInterval = 5000;

        // Clear existing timeout and start a new one with the updated interval
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(pollForMessages, pollingInterval);
        }
      }
    };

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;

      if (isTabActive) {
        // When tab becomes active, immediately refresh and reset polling
        lastActivityTime = Date.now();
        refreshChats();

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        pollingInterval = 5000;
        timeoutId = setTimeout(pollForMessages, pollingInterval);
      }
    };

    // Start initial polling
    timeoutId = setTimeout(pollForMessages, pollingInterval);

    // Listen for user activity
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (inactivityTimerId) clearTimeout(inactivityTimerId);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshChats]);

  return (
    <ChatContext.Provider value={{ refreshChats, refreshMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

// Helper function to add a new message to the cache
export function addMessageToCache(
  queryClient: any,
  chatId: string,
  message: MessageData
) {
  if (!queryClient || !chatId || !message) {
    debug.error("Missing required parameters for addMessageToCache");
    return;
  }

  // Update messages cache
  queryClient.setQueryData(
    ["messages", chatId],
    (old: { messages: MessageData[]; previousCursor: string | null } | undefined) => {
      if (!old || !Array.isArray(old.messages)) {
        return { messages: [message], previousCursor: null };
      }

      // Check if message already exists to avoid duplicates
      const messageExists = old.messages.some(m => m.id === message.id);
      if (messageExists) {
        return old;
      }

      return {
        ...old,
        messages: [...old.messages, message],
      };
    }
  );

  // Update chats cache to show the latest message
  queryClient.setQueryData(
    ["chats"],
    (old: { chats: ChatData[]; nextCursor: string | null } | undefined) => {
      // If there's no data in the cache yet, return the current state
      if (!old || !Array.isArray(old.chats)) {
        return old;
      }

      // Find the chat in the cache
      const chatIndex = old.chats.findIndex(chat => chat && chat.id === chatId);

      // If chat doesn't exist in cache, don't modify anything
      if (chatIndex === -1) {
        return old;
      }

      // Create a new array with the updated chat
      const updatedChats = [...old.chats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        lastMessageAt: message.createdAt,
        messages: [message],
      };

      // Sort chats by lastMessageAt
      updatedChats.sort((a, b) => {
        if (!a || !a.lastMessageAt) return 1;
        if (!b || !b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      return {
        ...old,
        chats: updatedChats,
      };
    }
  );
}
