"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import MessagesButton from "./MessagesButton";
import { MessageCountInfo } from "@/lib/types";

interface MessagesButtonWrapperProps {
  initialState: MessageCountInfo;
}

export default function MessagesButtonWrapper({ 
  initialState 
}: MessagesButtonWrapperProps) {
  // Create a new QueryClient instance for this component
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        refetchOnMount: true,
        refetchOnReconnect: true,
        structuralSharing: true,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <MessagesButton initialState={initialState} />
    </QueryClientProvider>
  );
}
