"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import debug from "@/lib/debug";

interface FollowBackButtonProps {
  userId: string;
  username: string;
  displayName: string;
  className?: string;
}

export default function FollowBackButton({
  userId,
  username,
  displayName,
  className,
}: FollowBackButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if the user is already following the other user
  const { data: followData, isLoading } = useQuery({
    queryKey: ["follower-info", userId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/users/${userId}/followers`);
        return response.data;
      } catch (error) {
        debug.error("Error checking follow status:", error);
        return { isFollowedByUser: false };
      }
    },
    onSuccess: (data) => {
      setIsFollowing(data.isFollowedByUser);
    },
  });

  // Handle follow back
  const { mutate: followUser } = useMutation({
    mutationFn: () => apiClient.post(`/api/users/${userId}/followers`),
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: () => {
      setIsFollowing(true);
      toast({
        description: `You are now following ${displayName}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["follower-info", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      debug.error("Error following user:", error);
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

  // Don't show the button if:
  // 1. Data is still loading
  // 2. User is already following
  // 3. Follow data shows user is already following
  if (isLoading || isFollowing || (followData && followData.isFollowedByUser)) {
    return null;
  }

  return (
    <Button
      size="sm"
      onClick={() => followUser()}
      disabled={isProcessing}
      className={className}
    >
      Follow Back
    </Button>
  );
}
