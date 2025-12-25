'use client';

import FollowButton from "@/components/FollowButton";
import Linkify from "@/components/Linkify";
import LoginButton from "./LoginButton";
import UserAvatar from "@/components/UserAvatar";
import UserTooltip from "@/components/UserTooltip";
import { UserData } from "@/lib/types";
import Link from "next/link";

interface UserInfoSidebarClientProps {
  user: UserData;
  loggedInUser: any;
  isLoggedIn: boolean;
}

export default function UserInfoSidebarClient({
  user,
  loggedInUser,
  isLoggedIn,
}: UserInfoSidebarClientProps) {
  // For guest users, show a simplified sidebar
  if (!isLoggedIn) {
    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">About this user</div>
        <UserTooltip user={user}>
          <Link
            href={`/users/${user.username}`}
            className="flex items-center gap-3"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              className="flex-none"
              showStatus={user.showOnlineStatus}
              status={user.onlineStatus as any}
              statusSize="sm"
            />
            <div>
              <p className="line-clamp-1 break-all font-semibold hover:underline">
                {user.displayName}
              </p>
              <p className="line-clamp-1 break-all text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </Link>
        </UserTooltip>
        <div className="line-clamp-6 whitespace-pre-line break-words text-muted-foreground">
          <Linkify>{user.bio}</Linkify>
        </div>
        <div className="mt-4">
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">About this user</div>
      <UserTooltip user={user}>
        <Link
          href={`/users/${user.username}`}
          className="flex items-center gap-3"
        >
          <UserAvatar
            avatarUrl={user.avatarUrl}
            className="flex-none"
            showStatus={loggedInUser?.id === user.id || user.showOnlineStatus}
            status={user.onlineStatus as any}
            statusSize="sm"
          />
          <div>
            <p className="line-clamp-1 break-all font-semibold hover:underline">
              {user.displayName}
            </p>
            <p className="line-clamp-1 break-all text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </Link>
      </UserTooltip>
      <div className="line-clamp-6 whitespace-pre-line break-words text-muted-foreground">
        <Linkify>{user.bio}</Linkify>
      </div>
      {isLoggedIn && user.id !== loggedInUser.id && (
        <FollowButton
          userId={user.id}
          initialState={{
            followers: user._count.followers,
            isFollowedByUser: user.followers.some(
              ({ followerId }) => followerId === loggedInUser.id,
            ),
          }}
        />
      )}
    </div>
  );
}
