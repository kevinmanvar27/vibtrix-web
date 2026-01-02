"use client";

import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { NotificationCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationsButtonProps {
  initialState: NotificationCountInfo;
}

export default function NotificationsButton({
  initialState,
}: NotificationsButtonProps) {
  const { data } = useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: async () => {
      // Skip API calls during server-side rendering
      if (typeof window === 'undefined') {
        return initialState;
      }

      try {
        // Use apiClient instead of fetch for better error handling
        const response = await apiClient.get<NotificationCountInfo>('/api/notifications/unread-count')
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

  return (
    <Button
      variant="ghost"
      className="flex items-center justify-start gap-3"
      title="Notifications"
      asChild
    >
      <Link href="/notifications">
        <div className="relative">
          <Bell />
          {!!data.unreadCount && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Notifications</span>
      </Link>
    </Button>
  );
}
