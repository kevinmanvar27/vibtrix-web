"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import apiClient from "@/lib/api-client";
import { FollowerInfo } from "@/lib/types";
import { QueryKey, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

import debug from "@/lib/debug";

interface EnhancedFollowButtonProps {
  userId: string;
  initialState: FollowerInfo;
  isPrivateProfile?: boolean;
  hasPendingRequest?: boolean;
}

export default function EnhancedFollowButton({
  userId,
  initialState,
  isPrivateProfile = false,
  hasPendingRequest = false,
}: EnhancedFollowButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPendingRequest, setIsPendingRequest] = useState(hasPendingRequest);

  const { data } = useFollowerInfo(userId, initialState);

  // Query for follow request status
  const { data: requestData } = useQuery({
    queryKey: ["follow-request", userId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/users/${userId}/follow-request`);
        return response.data;
      } catch (error) {
        return { status: null };
      }
    },
    initialData: { status: hasPendingRequest ? "PENDING" : null },
    enabled: isPrivateProfile && !data.isFollowedByUser,
  });

  const followQueryKey: QueryKey = ["follower-info", userId];
  const requestQueryKey: QueryKey = ["follow-request", userId];

  // Regular follow/unfollow mutation
  const { mutate: followMutate } = useMutation({
    mutationFn: () =>
      data.isFollowedByUser
        ? apiClient.delete(`/api/users/${userId}/followers`)
        : apiClient.post(`/api/users/${userId}/followers`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: followQueryKey });

      const previousState = queryClient.getQueryData<FollowerInfo>(followQueryKey);

      queryClient.setQueryData<FollowerInfo>(followQueryKey, () => ({
        followers:
          (previousState?.followers || 0) +
          (previousState?.isFollowedByUser ? -1 : 1),
        isFollowedByUser: !previousState?.isFollowedByUser,
      }));

      return { previousState };
    },
    onError(error: any, variables, context) {
      queryClient.setQueryData(followQueryKey, context?.previousState);

      // Don't show error toast for unauthorized errors
      if (error.status === 401) {
        // Redirect to login page
        router.push(`/login/google?from=${encodeURIComponent(window.location.href)}`);
        return;
      }

      debug.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  // Send follow request mutation
  const { mutate: requestMutate } = useMutation({
    mutationFn: () => apiClient.post(`/api/users/${userId}/follow-request`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: requestQueryKey });

      const previousState = queryClient.getQueryData(requestQueryKey);

      queryClient.setQueryData(requestQueryKey, { status: "PENDING" });
      setIsPendingRequest(true);

      return { previousState };
    },
    onSuccess: () => {
      toast({
        description: "Follow request sent",
      });
    },
    onError(error: any) {
      setIsPendingRequest(false);
      queryClient.invalidateQueries({ queryKey: requestQueryKey });

      // Don't show error toast for unauthorized errors
      if (error.status === 401) {
        // Redirect to login page
        router.push(`/login/google?from=${encodeURIComponent(window.location.href)}`);
        return;
      }

      debug.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  // Cancel follow request mutation
  const { mutate: cancelRequestMutate } = useMutation({
    mutationFn: () => apiClient.delete(`/api/users/${userId}/follow-request`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: requestQueryKey });

      const previousState = queryClient.getQueryData(requestQueryKey);

      queryClient.setQueryData(requestQueryKey, { status: null });
      setIsPendingRequest(false);

      return { previousState };
    },
    onSuccess: () => {
      toast({
        description: "Follow request canceled",
      });
    },
    onError(error: any, variables, context) {
      setIsPendingRequest(true);
      queryClient.invalidateQueries({ queryKey: requestQueryKey });

      // Don't show error toast for unauthorized errors
      if (error.status === 401) {
        // Redirect to login page
        router.push(`/login/google?from=${encodeURIComponent(window.location.href)}`);
        return;
      }

      debug.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  const handleClick = () => {
    if (isPrivateProfile && !data.isFollowedByUser) {
      // For private profiles that user doesn't follow
      if (isPendingRequest || requestData?.status === "PENDING") {
        // Cancel the request
        cancelRequestMutate();
      } else {
        // Send a follow request
        requestMutate();
      }
    } else {
      // Regular follow/unfollow
      followMutate();
    }
  };

  // Determine button text based on state
  let buttonText = "Follow";
  let buttonVariant: "default" | "secondary" | "outline" = "default";

  if (data.isFollowedByUser) {
    buttonText = "Unfollow";
    buttonVariant = "secondary";
  } else if (isPrivateProfile && (isPendingRequest || requestData?.status === "PENDING")) {
    buttonText = "Requested";
    buttonVariant = "outline";
  }

  return (
    <Button
      variant={buttonVariant}
      onClick={handleClick}
    >
      {buttonText}
    </Button>
  );
}
