"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import NotificationsButton from "./NotificationsButton";
import { NotificationCountInfo } from "@/lib/types";

interface NotificationsButtonWrapperProps {
  initialState: NotificationCountInfo;
}

export default function NotificationsButtonWrapper({ 
  initialState 
}: NotificationsButtonWrapperProps) {
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
      <NotificationsButton initialState={initialState} />
    </QueryClientProvider>
  );
}
