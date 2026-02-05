"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { PostData } from "@/lib/types";
import { OnlineStatus } from "@/lib/types/onlineStatus";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import Comments from "../comments/Comments";
import CommentButton from "../comments/CommentButton";
import Linkify from "../Linkify";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import BookmarkButton from "./BookmarkButton";
import LikeButton from "./LikeButton";
import MediaPreviews from "./MediaPreviews";
import PostMoreButton from "./PostMoreButton";
import ShareButton from "./ShareButton";
import ViewCount from "./ViewCount";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import dynamic from "next/dynamic";
import { Maximize2 } from "lucide-react";

// Dynamically import VideoModal to avoid SSR issues
const VideoModal = dynamic(() => import("./VideoModal"), {
  ssr: false,
});

interface PostProps {
  post: PostData;
  competitionId?: string; // Optional competition ID for competition-specific stickers
}

export default function Post({ post, competitionId }: PostProps) {
  const { user, isLoggedIn } = useSession();
  const { likesEnabled, commentsEnabled, sharingEnabled, viewsEnabled, bookmarksEnabled } = useFeatureSettings();

  const [showComments, setShowComments] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const likeInfo = {
    likes: post._count.likes,
    isLikedByUser: isLoggedIn ? post.likes.some((like) => like.userId === user?.id) : false,
  };

  // Check if post has a video attachment
  const hasVideo = post.attachments.some(a => a.type === "VIDEO");

  return (
    <>
      <article className="group/post space-y-3 rounded-2xl bg-card p-4 shadow-md border border-border/30 hover:shadow-lg transition-shadow duration-300">
        <div className="flex justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <UserTooltip user={post.user}>
              <Link href={`/users/${post.user.username}`}>
                <UserAvatar
                  avatarUrl={post.user.avatarUrl}
                  showStatus={true}
                  status={(post.user.onlineStatus as OnlineStatus) || OnlineStatus.OFFLINE}
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
          <div className="flex items-center gap-2">
            {isLoggedIn && user && post.user.id === user.id && (
              <PostMoreButton
                post={post}
                className="opacity-0 transition-opacity group-hover/post:opacity-100"
              />
            )}
          </div>
        </div>
        {post.content && (
          <div className="whitespace-pre-line break-words text-base">
            <Linkify>{post.content}</Linkify>
          </div>
        )}
        {!!post.attachments.length && (
          <div className="mt-2 mb-1 relative group/media">
            <MediaPreviews
              attachments={post.attachments}
              postId={post.id}
              initialLikeState={likeInfo}
              competitionId={competitionId}
            />
            {/* Fullscreen button overlay for video posts */}
            {hasVideo && (
              <button
                onClick={() => setShowVideoModal(true)}
                className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors opacity-0 group-hover/media:opacity-100"
                title="Watch in fullscreen"
              >
                <Maximize2 className="h-5 w-5 text-white" />
              </button>
            )}
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

      {/* Video Modal */}
      {hasVideo && (
        <VideoModal
          post={post}
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </>
  );
}