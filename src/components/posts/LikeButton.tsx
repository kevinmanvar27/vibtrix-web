import { LikeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { useLike } from "./useLike";
import RequireAuth from "@/components/RequireAuth";

interface LikeButtonProps {
  postId: string;
  initialState: LikeInfo;
}

export default function LikeButton({ postId, initialState }: LikeButtonProps) {
  const { likesEnabled } = useFeatureSettings();
  const { toggle, isLiked, isLoading, likeCount } = useLike(postId, initialState);

  if (!likesEnabled) {
    return null;
  }

  // The actual button content
  const buttonContent = (
    <>
      <Heart
        className={cn(
          "size-5",
          isLiked && "fill-red-500 text-red-500",
        )}
      />
      <span className="text-sm font-medium tabular-nums">
        {likeCount} <span className="hidden sm:inline">likes</span>
      </span>
    </>
  );

  // Create a click handler that prevents event bubbling
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle();
  };

  // Wrap the button in RequireAuth to handle guest users
  return (
    <RequireAuth>
      <button
        onClick={handleClick}
        className="flex items-center gap-2"
        disabled={isLoading}
      >
        {buttonContent}
      </button>
    </RequireAuth>
  );
}
