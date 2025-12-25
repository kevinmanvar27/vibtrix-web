"use client";

import debug from "@/lib/debug";

// Create a global variable to store the selected chat ID
let selectedChatId: string | null = null;

export function useChatSelection() {
  // Function to set the selected chat ID
  const setSelectedChat = (chatId: string | null) => {
    debug.log(`useChatSelection - Setting selected chat ID: ${chatId}`);
    selectedChatId = chatId;
  };

  // Function to get the selected chat ID
  const getSelectedChat = () => {
    debug.log(`useChatSelection - Getting selected chat ID: ${selectedChatId}`);
    return selectedChatId;
  };

  return {
    setSelectedChat,
    getSelectedChat,
  };
}
