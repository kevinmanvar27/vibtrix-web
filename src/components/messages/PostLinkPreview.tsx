"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostData } from "@/lib/types";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { formatRelativeDate } from "@/lib/utils";
import Image from "next/image";

import debug from "@/lib/debug";

interface PostLinkPreviewProps {
  postId: string;
}

export default function PostLinkPreview({ postId }: PostLinkPreviewProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we have a valid postId
    if (!postId || postId.length < 5) { // Basic validation for postId
      setIsLoading(false);
      setError("Invalid post link");
      return;
    }

    // Use a timeout to prevent excessive API calls
    const timeoutId = setTimeout(() => {
      const fetchPost = async () => {
        try {
          setIsLoading(true);

          // Use fetch directly with error handling for non-JSON responses
          const response = await fetch(`/api/posts/${postId}`, {
            headers: {
              'Accept': 'application/json'
            },
            // Add cache control to prevent caching errors
            cache: 'no-store'
          });

          if (!response.ok) {
            throw new Error(`Post not found (${response.status})`);
          }

          // Check content type to avoid JSON parse errors
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format');
          }

          const data = await response.json();
          if (!data || !data.id) {
            throw new Error('Invalid post data');
          }

          setPost(data);
          setError(null);
        } catch (err) {
          debug.error("Error fetching post:", err);
          setError("Post not available");
        } finally {
          setIsLoading(false);
        }
      };

      fetchPost();
    }, 500); // 500ms delay to prevent excessive API calls

    // Cleanup function to cancel the timeout if the component unmounts
    return () => clearTimeout(timeoutId);
  }, [postId]);

  if (isLoading) {
    return (
      <Card className="mt-2 overflow-hidden">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-1 h-3 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !post) {
    return (
      <Link href={`/posts/${postId}`} className="block mt-2">
        <Card className="mt-2 overflow-hidden border-dashed hover:bg-muted/50 transition-colors">
          <CardContent className="p-3 flex items-center gap-2">
            <div className="rounded-full bg-muted flex items-center justify-center size-8">
              <svg className="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">View Post</p>
              <p className="text-xs text-muted-foreground">
                {error || "Post not available"}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/posts/${post.id}`} className="block mt-2">
      <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <UserAvatar
              avatarUrl={post.user.avatarUrl}
              showStatus={false}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium truncate">{post.user.displayName}</p>
                <span className="text-xs text-muted-foreground">
                  @{post.user.username}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {formatRelativeDate(post.createdAt)}
              </p>
              <p className="text-sm line-clamp-2 mt-1">{post.content}</p>

              {post.attachments.length > 0 && post.attachments[0].type === "IMAGE" && (
                <div className="mt-2 relative h-20 w-full overflow-hidden rounded-md">
                  <Image
                    src={post.attachments[0].url}
                    alt="Post attachment"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
