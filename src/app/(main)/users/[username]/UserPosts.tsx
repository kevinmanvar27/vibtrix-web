"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import apiClient from "@/lib/api-client";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import debug from "@/lib/debug";

interface UserPostsProps {
  userId: string;
}

export default function UserPosts({ userId }: UserPostsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "user-posts", userId],
    queryFn: async ({ pageParam }) => {
      try {
        const response = await apiClient.get<PostsPage>(`/api/users/${userId}/posts`, {
          params: pageParam ? { cursor: pageParam } : undefined,
        });

        // Check if this is a private profile response
        if ((response.data as any)?.error === "This user's profile is private") {
          debug.log("Private profile detected in UserPosts");
        }

        return response.data;
      } catch (err: any) {
        debug.error("Error fetching user posts:", err);
        throw err;
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        This user hasn&apos;t posted anything yet.
      </p>
    );
  }

  // Check for private profile in the data
  if (data?.pages?.some(page => (page as any)?.error === "This user's profile is private")) {
    return (
      <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold mb-4">Private Profile</h2>
        <p className="text-muted-foreground mb-4">
          This account is private. Follow this account to see their photos and videos.
        </p>
      </div>
    );
  }

  // Handle other errors
  if (status === "error" || data?.pages?.some(page => (page as any)?.error)) {
    const errorMessage = (data?.pages?.find(page => (page as any)?.error) as any)?.error ||
      (error as any)?.message ||
      "An error occurred while loading posts";

    return (
      <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold mb-4 text-destructive">Error</h2>
        <p className="text-muted-foreground mb-4">
          {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
