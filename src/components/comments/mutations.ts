import { CommentsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { deleteComment, submitComment } from "./actions";

import debug from "@/lib/debug";

export function useSubmitCommentMutation(postId: string) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitComment,
    onSuccess: async (newComment) => {
      const queryKey: QueryKey = ["comments", postId];

      await queryClient.cancelQueries({ queryKey });

      // Update the comments data
      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          const firstPage = oldData?.pages[0];

          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  previousCursor: firstPage.previousCursor,
                  comments: [...firstPage.comments, newComment],
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
          return oldData;
        },
      );

      // Update the post data to increment the comment count
      queryClient.setQueriesData(
        { queryKey: ["post-feed"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          // Handle infinite query data structure
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts.map((post: any) => {
                  if (post.id === postId) {
                    return {
                      ...post,
                      _count: {
                        ...post._count,
                        comments: post._count.comments + 1,
                      },
                    };
                  }
                  return post;
                }),
              })),
            };
          }

          return oldData;
        }
      );

      queryClient.invalidateQueries({
        queryKey,
        predicate(query) {
          return !query.state.data;
        },
      });

      toast({
        description: "Comment created",
      });
    },
    onError(error) {
      debug.error(error);
      toast({
        variant: "destructive",
        description: "Failed to submit comment. Please try again.",
      });
    },
  });

  return mutation;
}

export function useDeleteCommentMutation() {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async (deletedComment) => {
      const queryKey: QueryKey = ["comments", deletedComment.postId];

      await queryClient.cancelQueries({ queryKey });

      // Update the comments data
      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          if (!oldData) return;

          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              previousCursor: page.previousCursor,
              comments: page.comments.filter((c) => c.id !== deletedComment.id),
            })),
          };
        },
      );

      // Update the post data to decrement the comment count
      queryClient.setQueriesData(
        { queryKey: ["post-feed"] },
        (oldData: any) => {
          if (!oldData) return oldData;

          // Handle infinite query data structure
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts.map((post: any) => {
                  if (post.id === deletedComment.postId) {
                    return {
                      ...post,
                      _count: {
                        ...post._count,
                        comments: Math.max(0, post._count.comments - 1),
                      },
                    };
                  }
                  return post;
                }),
              })),
            };
          }

          return oldData;
        }
      );

      toast({
        description: "Comment deleted",
      });
    },
    onError(error) {
      debug.error(error);
      toast({
        variant: "destructive",
        description: "Failed to delete comment. Please try again.",
      });
    },
  });

  return mutation;
}
