"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { PostData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import Comments from "../comments/Comments";
import CommentButton from "../comments/CommentButton";
import Linkify from "../Linkify";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import BookmarkButton from "../posts/BookmarkButton";
import LikeButton from "../posts/LikeButton";
import PostMoreButton from "../posts/PostMoreButton";
import ShareButton from "../posts/ShareButton";
import ViewCount from "../posts/ViewCount";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import FeedMediaPreviews from "./FeedMediaPreviews";

import debug from "@/lib/debug";

interface FeedPostProps {
  post: PostData;
}

export default function FeedPost({ post }: FeedPostProps) {
  debug.log('COMPONENT: FeedPost - Rendering post', { postId: post.id });

  const { user, isLoggedIn } = useSession();
  const { likesEnabled, commentsEnabled, sharingEnabled, viewsEnabled, bookmarksEnabled } = useFeatureSettings();

  const [showComments, setShowComments] = useState(false);
  const likeInfo = {
    likes: post._count.likes,
    isLikedByUser: isLoggedIn ? post.likes.some((like) => like.userId === user?.id) : false,
  };

  return (
    <article className="group/post space-y-3 rounded-2xl bg-card p-4 shadow-md border border-border/30 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <UserTooltip user={post.user}>
            <Link href={`/users/${post.user.username}`}>
              <UserAvatar
                avatarUrl={post.user.avatarUrl}
                showStatus={true}
                status={post.user.onlineStatus}
                statusSize="sm"
              />
            </Link>
          </UserTooltip>
          <div>
            <UserTooltip user={post.user}>
              <Link
                href={`/users/${post.user.username}`}
                className="block font-medium hover:underline"
              >
                {post.user.displayName}
              </Link>
            </UserTooltip>
            <Link
              href={`/posts/${post.id}`}
              className="block text-sm text-muted-foreground hover:underline"
              suppressHydrationWarning
            >
              {formatRelativeDate(post.createdAt)}
            </Link>
          </div>
        </div>
        {isLoggedIn && user && post.user.id === user.id && (
          <PostMoreButton
            post={post}
            className="opacity-0 transition-opacity group-hover/post:opacity-100"
          />
        )}
      </div>
      {post.content && (
        <div className="whitespace-pre-line break-words text-base">
          <Linkify>{post.content}</Linkify>
        </div>
      )}
      {!!post.attachments.length && (
        <div className="mt-2 mb-1">
          <FeedMediaPreviews
            attachments={post.attachments}
            postId={post.id}
            initialLikeState={likeInfo}
          />
        </div>
      )}
      <hr className="text-muted-foreground my-2" />
      <div className="flex justify-between gap-4">
        <div className="flex items-center gap-4">
          {likesEnabled && (
            <LikeButton
              postId={post.id}
              initialState={likeInfo}
            />
          )}
          {commentsEnabled && (
            <CommentButton
              post={post}
              onClick={() => setShowComments(!showComments)}
            />
          )}
          {sharingEnabled && (
            <ShareButton postId={post.id} />
          )}
          {viewsEnabled && (
            <ViewCount postId={post.id} />
          )}
        </div>
        {bookmarksEnabled && (
          <BookmarkButton
            postId={post.id}
            initialState={{
              isBookmarkedByUser: isLoggedIn ? post.bookmarks.some(
                (bookmark) => bookmark.userId === user?.id,
              ) : false,
            }}
          />
        )}
      </div>
      {showComments && commentsEnabled && <Comments post={post} />}
    </article>
  );
}
