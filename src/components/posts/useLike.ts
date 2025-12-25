import apiClient from "@/lib/api-client";
import { LikeInfo } from "@/lib/types";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { useGuestSession } from "../GuestSessionProvider";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

import debug from "@/lib/debug";

export function useLike(postId: string, initialState: LikeInfo) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryKey: QueryKey = ["like-info", postId];

  // Get the guest session for redirecting unauthenticated users
  const { redirectToLogin } = useGuestSession();

  // Get the current state from the query cache
  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await apiClient.get<LikeInfo>(`/api/posts/${postId}/likes`);
        return response.data;
      } catch (error: any) {
        // Handle unauthorized errors gracefully
        if (error.status === 401) {
          return { likes: initialState.likes, isLikedByUser: false };
        }
        throw error;
      }
    },
    initialData: initialState,
    staleTime: Infinity,
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: () =>
      data.isLikedByUser
        ? apiClient.delete(`/api/posts/${postId}/likes`)
        : apiClient.post(`/api/posts/${postId}/likes`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<LikeInfo>(queryKey);

      queryClient.setQueryData<LikeInfo>(queryKey, () => ({
        likes:
          (previousState?.likes || 0) + (previousState?.isLikedByUser ? -1 : 1),
        isLikedByUser: !previousState?.isLikedByUser,
      }));

      return { previousState };
    },
    onError(error: any, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      debug.error(error);

      // Check if this is an authentication error
      if (error?.status === 401 || error?.response?.status === 401) {
        // If we have access to the redirect function, use it
        if (redirectToLogin) {
          redirectToLogin();
          return;
        }

        // Fallback: redirect to Google login directly using client-side navigation
        router.push(`/login/google?from=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // For other errors, show a toast
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  // Create a safe mutate function that handles authentication
  const safeMutate = useCallback(() => {
    try {
      mutate();
    } catch (error) {
      debug.error('Error in safeMutate:', error);
    }
  }, [mutate]);

  return {
    like: () => {
      // Only like if not already liked
      if (!data.isLikedByUser) {
        safeMutate();
      } else {
        // Just show the animation without making an API call
        debug.log("Post already liked, skipping API call");
      }
    },
    unlike: () => {
      // Only unlike if already liked
      if (data.isLikedByUser) {
        safeMutate();
      }
    },
    toggle: () => safeMutate(),
    isLoading,
    isLiked: data.isLikedByUser,
    likeCount: data.likes,
  };
}
