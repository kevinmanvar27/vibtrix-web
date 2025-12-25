import { QueryClient } from "@tanstack/react-query";
import { invalidateCompetitionFeedQueries } from "@/lib/query-utils";
import { toast } from "@/components/ui/use-toast";

import debug from "@/lib/debug";

/**
 * Client-side function to edit a post and properly invalidate caches
 */
export async function editCompetitionPost({
  postId,
  content,
  mediaIds,
  competitionId,
  queryClient,
}: {
  postId: string;
  content: string;
  mediaIds: string[];
  competitionId?: string;
  queryClient: QueryClient;
}) {

  try {
    // Call the API to edit the post
    const response = await fetch(`/api/posts/${postId}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, mediaIds }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to edit post");
    }

    const updatedPost = await response.json();

    // If this is a competition post, invalidate all related competition feed caches
    if (competitionId) {
      invalidateCompetitionFeedQueries(queryClient, competitionId);
    }

    // Also invalidate the general post cache
    queryClient.invalidateQueries({
      queryKey: ["post", postId],
    });

    toast({
      title: "Post updated",
      description: "Your post has been successfully updated.",
    });

    return updatedPost;
  } catch (error) {
    debug.error("Error editing post:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to edit post",
    });
    throw error;
  }
}
