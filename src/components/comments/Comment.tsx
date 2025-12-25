import { useSession } from "@/app/(main)/SessionProvider";
import { CommentData } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import UserTooltip from "../UserTooltip";
import CommentMoreButton from "./CommentMoreButton";
import { OnlineStatus } from "@/lib/types/onlineStatus";

interface CommentProps {
  comment: CommentData;
}

export default function Comment({ comment }: CommentProps) {
  const { user, isLoggedIn } = useSession();

  // Convert Prisma enum to TypeScript enum
  const convertOnlineStatus = (status: any): OnlineStatus => {
    switch (status) {
      case 'ONLINE':
        return OnlineStatus.ONLINE;
      case 'IDLE':
        return OnlineStatus.IDLE;
      case 'OFFLINE':
        return OnlineStatus.OFFLINE;
      default:
        return OnlineStatus.OFFLINE;
    }
  };

  return (
    <div className="group/comment flex gap-3 py-3">
      <span className="hidden sm:inline">
        <UserTooltip user={comment.user}>
          <Link href={`/users/${comment.user.username}`}>
            <UserAvatar
              avatarUrl={comment.user.avatarUrl}
              size={40}
              showStatus={true}
              status={convertOnlineStatus(comment.user.onlineStatus)}
              statusSize="sm"
            />
          </Link>
        </UserTooltip>
      </span>
      <div>
        <div className="flex items-center gap-1 text-sm">
          <UserTooltip user={comment.user}>
            <Link
              href={`/users/${comment.user.username}`}
              className="font-medium hover:underline"
            >
              {comment.user.displayName}
            </Link>
          </UserTooltip>
          <span className="text-muted-foreground">
            {formatRelativeDate(comment.createdAt)}
          </span>
        </div>
        <div>{comment.content}</div>
      </div>
      {isLoggedIn && user && comment.user.id === user.id && (
        <CommentMoreButton
          comment={comment}
          className="ms-auto opacity-0 transition-opacity group-hover/comment:opacity-100"
        />
      )}
    </div>
  );
}