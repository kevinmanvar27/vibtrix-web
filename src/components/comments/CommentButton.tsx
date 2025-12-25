"use client";

import { PostData } from "@/lib/types";
import { MessageSquare } from "lucide-react";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import RequireAuth from "@/components/RequireAuth";
import { useCommentCount } from "./useCommentCount";

interface CommentButtonProps {
  post: PostData;
  onClick: () => void;
}

export default function CommentButton({ post, onClick }: CommentButtonProps) {
  const { commentsEnabled } = useFeatureSettings();
  const { commentCount } = useCommentCount(post);

  if (!commentsEnabled) {
    return null;
  }

  // The button content
  const buttonContent = (
    <>
      <MessageSquare className="size-5" />
      <span className="text-sm font-medium tabular-nums">
        {commentCount}{" "}
        <span className="hidden sm:inline">comments</span>
      </span>
    </>
  );

  // Create a click handler that prevents event bubbling
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // Wrap the button in RequireAuth to handle guest users
  return (
    <RequireAuth>
      <button onClick={handleClick} className="flex items-center gap-2">
        {buttonContent}
      </button>
    </RequireAuth>
  );
}
