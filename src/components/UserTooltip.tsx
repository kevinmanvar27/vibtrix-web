"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { useClientOnlyUserOnlineStatus } from "@/hooks/useClientOnlyUserOnlineStatus";
import { formatTextWithLinks } from "@/lib/text-formatter";
import { FollowerInfo, UserData } from "@/lib/types";
import Link from "next/link";
import { PropsWithChildren } from "react";
import FollowButton from "./FollowButton";
import FollowerCount from "./FollowerCount";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import UserAvatar from "./UserAvatar";

interface UserTooltipProps extends PropsWithChildren {
  user: UserData;
}

export default function UserTooltip({ children, user }: UserTooltipProps) {
  const { user: loggedInUser, isLoggedIn } = useSession();
  const { data: onlineStatusData } = useClientOnlyUserOnlineStatus(user.id);

  const followerState: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: isLoggedIn ? !!user.followers.some(
      ({ followerId }) => followerId === loggedInUser?.id,
    ) : false,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>
          <div className="flex max-w-80 flex-col gap-3 break-words px-1 py-2.5 md:min-w-52">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/users/${user.username}`}>
                <UserAvatar
                  size={70}
                  avatarUrl={user.avatarUrl}
                  showStatus={loggedInUser?.id === user.id || user.showOnlineStatus}
                  status={onlineStatusData?.status || user.onlineStatus}
                  statusSize="md"
                />
              </Link>
              {isLoggedIn && loggedInUser?.id !== user.id && (
                <FollowButton userId={user.id} initialState={followerState} />
              )}
            </div>
            <div>
              <Link href={`/users/${user.username}`}>
                <div className="text-lg font-semibold hover:underline">
                  {user.displayName}
                </div>
                <div className="text-muted-foreground">@{user.username}</div>
              </Link>
            </div>
            {user.bio && (
              <div className="line-clamp-4 whitespace-pre-line">
                {formatTextWithLinks(user.bio)}
              </div>
            )}
            <FollowerCount userId={user.id} initialState={followerState} />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
