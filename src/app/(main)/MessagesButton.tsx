"use client";

import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { MessageCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useFeatureSettings } from "@/hooks/use-feature-settings";

interface MessagesButtonProps {
  initialState: MessageCountInfo;
}

export default function MessagesButton({ initialState }: MessagesButtonProps) {
  const { messagingEnabled } = useFeatureSettings();
  const { data, refetch } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: async () => {
      // Skip API calls during server-side rendering
      if (typeof window === 'undefined') {
        return initialState;
      }

      try {
        // Use apiClient instead of fetch for better error handling
        const response = await apiClient.get<MessageCountInfo>('/api/messages/unread-count')
          .catch(error => {
            // Return a default response object with unreadCount: 0
            return { data: { unreadCount: 0 } };
          });

        return response.data;
      } catch (error) {
        // Return a default value if the API fails
        return { unreadCount: 0 };
      }
    },
    initialData: initialState,
    refetchInterval: 30000, // Poll every 30 seconds (reduced from 3s for performance)
    staleTime: 15000, // Data stays fresh for 15 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount - use initial data
    // Disable this query during server-side rendering
    enabled: typeof window !== 'undefined',
    // Don't retry on auth errors
    retry: false,
  });

  if (!messagingEnabled) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      className="flex items-center justify-start gap-3"
      title="Messages"
      asChild
    >
      <Link href="/messages">
        <div className="relative">
          <Mail />
          {!!data.unreadCount && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Messages</span>
      </Link>
    </Button>
  );
}
