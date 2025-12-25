"use client";

import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface NotificationFollowAcceptedProps {
  notification: NotificationData;
}

export default function NotificationFollowAccepted({
  notification,
}: NotificationFollowAcceptedProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if the user is already following the other user
  const { data: followData, isLoading } = useQuery({
    queryKey: ["follower-info", notification.issuerId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/users/${notification.issuerId}/followers`);
        return response.data;
      } catch (error) {
        return { isFollowedByUser: false };
      }
    },
  });

  // Update isFollowing when data changes
  useEffect(() => {
    if (followData && typeof followData === 'object' && 'isFollowedByUser' in followData) {
      setIsFollowing((followData as any).isFollowedByUser);
    }
  }, [followData]);

  // Handle follow back
  const { mutate: followUser } = useMutation({
    mutationFn: () => apiClient.post(`/api/users/${notification.issuerId}/followers`),
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: () => {
      setIsFollowing(true);
      toast({
        description: `You are now following ${notification.issuer.displayName}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["follower-info", notification.issuerId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to follow user. Please try again.",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const showFollowBack = !isLoading && !isFollowing && (!followData || !(followData as any)?.isFollowedByUser);

  return (
    <div className={cn(
      "flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors",
      !notification.read && "bg-primary/10",
    )}>
      <div className="flex-1 space-y-3">
        <Link href={`/users/${notification.issuer.username}`}>
          <UserAvatar
            avatarUrl={notification.issuer.avatarUrl}
            size={36}
            showStatus={true}
            statusSize="sm"
          />
        </Link>
        <div>
          <Link href={`/users/${notification.issuer.username}`} className="hover:underline">
            <span className="font-bold">{notification.issuer.displayName}</span>
          </Link>{" "}
          <span>accepted your follow request</span>
          {showFollowBack && (
            <>
              {" · "}
              <span
                className="text-primary hover:underline cursor-pointer"
                onClick={() => !isProcessing && followUser()}
              >
                Follow back
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
