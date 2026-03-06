import { useSession } from "@/app/(main)/SessionProvider";
import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { submitPost } from "./actions";

import debug from "@/lib/debug";

export function useSubmitPostMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSession();

  const mutation = useMutation({
    mutationFn: async (variables: { content: string; mediaIds: string[] }) => {
      // Create a completely fresh plain object
      const payload = {
        content: variables.content,
        mediaIds: [...variables.mediaIds],
      };
      
      debug.log("Mutation payload:", payload);
      debug.log("Payload type check:", {
        isPlainObject: Object.getPrototypeOf(payload) === Object.prototype,
        contentType: typeof payload.content,
        mediaIdsType: typeof payload.mediaIds,
        mediaIdsIsArray: Array.isArray(payload.mediaIds),
      });
      
      return await submitPost(payload);
    },
    onSuccess: async (newPost) => {
      const queryFilter = {
        queryKey: ["post-feed"],
        predicate(query) {
          return (
            query.queryKey.includes("for-you") ||
            !!(user && query.queryKey.includes("user-posts") &&
              query.queryKey.includes(user.id))
          );
        },
      } satisfies QueryFilters;

      await queryClient.cancelQueries(queryFilter);

      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          const firstPage = oldData?.pages[0];

          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts],
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        },
      );

      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
        predicate(query) {
          return queryFilter.predicate(query) && !query.state.data;
        },
      });

      toast({
        description: "Post created",
      });
    },
    onError(error) {
      debug.error("Post submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to post. Please try again.";
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    },
  });

  return mutation;
}
