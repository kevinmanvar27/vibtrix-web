"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { PostData } from "@/lib/types";
import { cn } from "@/lib/utils";
import UserAvatar from "../UserAvatar";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import { useLike } from "./useLike";
import { useSession } from "@/app/(main)/SessionProvider";
import Comments from "../comments/Comments";
import ShareDialog from "./ShareDialog";
import apiClient from "@/lib/api-client";
import { useToast } from "../ui/use-toast";

interface VideoModalProps {
  post: PostData;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ post, isOpen, onClose }: VideoModalProps) {
  const { user, isLoggedIn } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Get video attachment
  const videoAttachment = post.attachments.find(a => a.type === "VIDEO");

  // Like functionality
  const likeInfo = {
    likes: post._count.likes,
    isLikedByUser: isLoggedIn ? post.likes.some((like) => like.userId === user?.id) : false,
  };
  const { toggle: toggleLike, isLiked, likeCount } = useLike(post.id, likeInfo);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(
    isLoggedIn ? post.bookmarks.some((b) => b.userId === user?.id) : false
  );
  const [isBookmarking, setIsBookmarking] = useState(false);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
    showControlsTemporarily();
  }, [isMuted, showControlsTemporarily]);

  // Handle escape key and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.key === "m") {
        toggleMute();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, togglePlayPause, toggleMute]);

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay was prevented, user needs to interact
        setIsPlaying(false);
      });
    }
  }, [isOpen]);

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      toggleLike();
    }
  }, [isLiked, toggleLike]);

  const handleBookmark = useCallback(async () => {
    if (!isLoggedIn || isBookmarking) return;
    
    setIsBookmarking(true);
    try {
      if (isBookmarked) {
        await apiClient.delete(`/api/posts/${post.id}/bookmark`);
      } else {
        await apiClient.post(`/api/posts/${post.id}/bookmark`);
      }
      setIsBookmarked(!isBookmarked);
      toast({
        description: `Post ${isBookmarked ? "un" : ""}bookmarked`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to bookmark post",
      });
    } finally {
      setIsBookmarking(false);
    }
  }, [isLoggedIn, isBookmarking, isBookmarked, post.id, toast]);

  if (!isOpen || !videoAttachment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Main content */}
      <div className="flex h-full">
        {/* Video section */}
        <div 
          className={cn(
            "relative flex-1 flex items-center justify-center",
            showComments ? "w-[60%]" : "w-full"
          )}
          onClick={togglePlayPause}
          onDoubleClick={handleDoubleTap}
          onMouseMove={showControlsTemporarily}
        >
          <video
            ref={videoRef}
            src={videoAttachment.url}
            className="max-h-full max-w-full object-contain"
            loop
            playsInline
            muted={isMuted}
          />

          {/* Play/Pause & Mute overlay */}
          {showControls && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-full bg-black/50">
                  {isPlaying ? (
                    <Pause className="h-12 w-12 text-white" />
                  ) : (
                    <Play className="h-12 w-12 text-white" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="p-3 rounded-full bg-black/50 pointer-events-auto"
                >
                  {isMuted ? (
                    <VolumeX className="h-8 w-8 text-white" />
                  ) : (
                    <Volume2 className="h-8 w-8 text-white" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Bottom user info */}
          <div className="absolute bottom-0 left-0 right-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Link 
              href={`/users/${post.user.username}`}
              className="flex items-center gap-3 mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <UserAvatar avatarUrl={post.user.avatarUrl} size={40} />
              <div>
                <p className="text-white font-semibold">{post.user.displayName}</p>
                <p className="text-white/70 text-sm">@{post.user.username}</p>
              </div>
            </Link>
            {post.content && (
              <p className="text-white text-sm line-clamp-2">{post.content}</p>
            )}
            <p className="text-white/50 text-xs mt-1">
              {formatRelativeDate(post.createdAt)}
            </p>
          </div>

          {/* Right side action buttons */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6">
            {/* Like button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className={cn(
                "p-3 rounded-full transition-colors",
                isLiked ? "bg-red-500/20" : "bg-black/50 hover:bg-black/70"
              )}>
                <Heart
                  className={cn(
                    "h-7 w-7",
                    isLiked ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
              </div>
              <span className="text-white text-sm font-medium">{likeCount}</span>
            </button>

            {/* Comment button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className={cn(
                "p-3 rounded-full transition-colors",
                showComments ? "bg-primary/20" : "bg-black/50 hover:bg-black/70"
              )}>
                <MessageCircle className="h-7 w-7 text-white" />
              </div>
              <span className="text-white text-sm font-medium">{post._count.comments}</span>
            </button>

            {/* Share button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShareDialog(true);
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                <Share2 className="h-7 w-7 text-white" />
              </div>
            </button>

            {/* Bookmark button */}
            {isLoggedIn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmark();
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className={cn(
                  "p-3 rounded-full transition-colors",
                  isBookmarked ? "bg-amber-500/20" : "bg-black/50 hover:bg-black/70"
                )}>
                  <Bookmark
                    className={cn(
                      "h-7 w-7",
                      isBookmarked ? "fill-amber-500 text-amber-500" : "text-white"
                    )}
                  />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Comments section */}
        {showComments && (
          <div 
            className="w-[40%] max-w-md bg-background border-l border-border overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Comments post={post} />
            </div>
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <ShareDialog
        postId={post.id}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  );
}
