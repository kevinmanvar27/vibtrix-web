"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import apiClient from "@/lib/api-client";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import debug from "@/lib/debug";

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const trimmedQuery = query.trim();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "search", trimmedQuery],
    enabled: !!trimmedQuery,
    queryFn: async ({ pageParam }) => {
      const response = await apiClient.get<PostsPage>("/api/search", {
        params: {
          q: trimmedQuery,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      });
      return response.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  // Don't display anything if query is empty
  if (!trimmedQuery) {
    return null;
  }

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <p className="text-center text-muted-foreground">
        No posts found for this query.
      </p>
    );
  }

  if (status === "error") {
    debug.error('Search error:', error);
    return (
      <div className="text-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <p className="text-destructive font-medium mb-2">An error occurred while loading posts.</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Please try again later.'}
        </p>
        {/* Add a sign-in button if the error is related to authentication */}
        {error instanceof Error && error.message.includes('Unauthorized') && (
          <a
            href={`/login/google?from=${encodeURIComponent(window.location.href)}`}
            className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        )}
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-4"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-4 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
