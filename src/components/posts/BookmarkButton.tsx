import apiClient from "@/lib/api-client";
import { BookmarkInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useToast } from "../ui/use-toast";
import RequireAuth from "@/components/RequireAuth";
import { useGuestSession } from "@/components/GuestSessionProvider";

import debug from "@/lib/debug";

interface BookmarkButtonProps {
  postId: string;
  initialState: BookmarkInfo;
}

export default function BookmarkButton({
  postId,
  initialState,
}: BookmarkButtonProps) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const queryKey: QueryKey = ["bookmark-info", postId];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<BookmarkInfo>(`/api/posts/${postId}/bookmark`);
      return response.data;
    },
    initialData: initialState,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: () =>
      data.isBookmarkedByUser
        ? apiClient.delete(`/api/posts/${postId}/bookmark`)
        : apiClient.post(`/api/posts/${postId}/bookmark`),
    onMutate: async () => {
      toast({
        description: `Post ${data.isBookmarkedByUser ? "un" : ""}bookmarked`,
      });

      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<BookmarkInfo>(queryKey);

      queryClient.setQueryData<BookmarkInfo>(queryKey, () => ({
        isBookmarkedByUser: !previousState?.isBookmarkedByUser,
      }));

      return { previousState };
    },
    onError(error, variables, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      debug.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    },
  });

  // The button content
  const buttonContent = (
    <Bookmark
      className={cn(
        "size-5",
        data.isBookmarkedByUser && "fill-primary text-primary",
      )}
    />
  );

  // Wrap the button in RequireAuth to handle guest users
  return (
    <RequireAuth>
      <button onClick={() => mutate()} className="flex items-center gap-2">
        {buttonContent}
      </button>
    </RequireAuth>
  );
}
