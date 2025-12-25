"use client";

import { PostData } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useCommentCount(post: PostData) {
  const queryClient = useQueryClient();
  const [commentCount, setCommentCount] = useState(post._count.comments);

  // Listen for changes to the comments query
  useEffect(() => {
    const queryKey = ["comments", post.id];
    
    // Update the comment count when the comments query changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const query = queryClient.getQueryState(queryKey);
      if (query?.data) {
        // Count the total number of comments across all pages
        const data = query.data as any;
        if (data.pages) {
          const totalComments = data.pages.reduce(
            (total: number, page: any) => total + page.comments.length,
            0
          );
          setCommentCount(totalComments);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [post.id, queryClient]);

  return { commentCount };
}
