import { Eye } from "lucide-react";
import { usePostView } from "./usePostView";
import { cn, formatNumber } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ViewCountProps {
  postId: string;
  className?: string;
}

export default function ViewCount({ postId, className }: ViewCountProps) {
  const { viewCount, isLoading } = usePostView(postId);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1 text-muted-foreground cursor-pointer", className)}>
            <Eye size={18} />
            <span className="text-sm">
              {isLoading ? "..." : formatNumber(viewCount)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{viewCount.toLocaleString()} views</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
