import apiClient from "@/lib/api-client";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import debug from "@/lib/debug";

// Use localStorage to track viewed posts across page refreshes
const LOCAL_STORAGE_KEY = 'vibtrix_viewed_posts';

// Helper function to get viewed posts from localStorage
function getViewedPosts(): Set<string> {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const storedPosts = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedPosts ? new Set(JSON.parse(storedPosts)) : new Set<string>();
  } catch (error) {
    debug.error('Error reading from localStorage:', error);
    return new Set<string>();
  }
}

// Helper function to save viewed posts to localStorage
function saveViewedPost(postId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const viewedPosts = getViewedPosts();
    viewedPosts.add(postId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...viewedPosts]));
  } catch (error) {
    debug.error('Error saving to localStorage:', error);
  }
}

export function usePostView(postId: string) {
  const queryClient = useQueryClient();

  // Query to get view count
  const { data, isLoading, error } = useQuery({
    queryKey: ["post-views", postId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ viewCount: number }>(`/api/posts/${postId}/view`);
        return response.data;
      } catch (error: any) {
        // Handle rate limiting errors gracefully
        if (error.status === 429) {
          return { viewCount: 0 };
        }
        // Handle unauthorized errors gracefully
        if (error.status === 401) {
          return { viewCount: 0 };
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      // Don't retry on rate limiting or auth errors
      if (error?.status === 429 || error?.status === 401) return false;
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  // Record view when component mounts, but only once per post per browser session
  useEffect(() => {
    // Check if we've already viewed this post
    const viewedPosts = getViewedPosts();

    if (!viewedPosts.has(postId)) {
      const recordView = async () => {
        try {
          await apiClient.post(`/api/posts/${postId}/view`);

          // Save to localStorage
          saveViewedPost(postId);

          // Invalidate the query to get the updated count
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["post-views", postId] });
          }, 500);
        } catch (error: any) {
          // Don't log unauthorized errors as they're expected for guest users
          if (error.status !== 401) {
            debug.error("Failed to record post view:", error);
          }

          // Still save to localStorage for guest users to prevent repeated attempts
          saveViewedPost(postId);
        }
      };

      recordView();
    }
  }, [postId, queryClient]);

  return {
    viewCount: data?.viewCount || 0,
    isLoading,
    error
  };
}
