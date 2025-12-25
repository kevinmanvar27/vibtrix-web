"use client";

import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, UserPlus, X } from "lucide-react";
import FollowBackButton from "@/components/FollowBackButton";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import debug from "@/lib/debug";

interface NotificationFollowRequestProps {
  notification: NotificationData & { followRequestId?: string };
  onAccept?: () => void;
}

export default function NotificationFollowRequest({
  notification,
  onAccept,
}: NotificationFollowRequestProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestAccepted, setRequestAccepted] = useState(false);

  // Handle accept/reject follow request
  const { mutate: handleRequest } = useMutation({
    mutationFn: async (action: "accept" | "reject") => {
      if (!notification.followRequestId) {
        throw new Error("Follow request ID is missing");
      }

      const response = await apiClient.patch(
        `/api/users/follow-requests/${notification.followRequestId}`,
        { action }
      );
      return response.data;
    },
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: (data, variables) => {
      if (variables === "accept") {
        toast({
          description: "Follow request accepted",
        });
        setRequestAccepted(true);
        if (onAccept) onAccept();
      } else {
        toast({
          description: "Follow request rejected",
        });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
    },
    onError: (error) => {
      debug.error("Error handling follow request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the follow request. Please try again.",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

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
          <span>requested to follow you</span>
        </div>

        {notification.followRequestId && !requestAccepted ? (
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={() => handleRequest("accept")}
              disabled={isProcessing}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRequest("reject")}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        ) : requestAccepted && (
          <div className="mt-2">
            <span
              className="text-primary hover:underline cursor-pointer"
              onClick={() => {
                const followBackButton = document.querySelector('[data-follow-back-button]');
                if (followBackButton) {
                  (followBackButton as HTMLElement).click();
                }
              }}
            >
              Follow back
            </span>
            <span className="hidden">
              <FollowBackButton
                userId={notification.issuerId}
                username={notification.issuer.username}
                displayName={notification.issuer.displayName}
                className="hidden"
                data-follow-back-button
              />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
