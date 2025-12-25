"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import FollowButton from "@/components/FollowButton";
import UserAvatar from "@/components/UserAvatar";
import UserTooltip from "@/components/UserTooltip";
import apiClient from "@/lib/api-client";
import { FollowerInfo, UserData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import MessageButton from "./MessageButton";

import debug from "@/lib/debug";

interface UserSearchResultsProps {
  query: string;
}

export default function UserSearchResults({ query }: UserSearchResultsProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { users: [] };
      }
      const response = await apiClient.get<{ users: UserData[] }>("/api/users/search", {
        params: { q: query }
      });
      return response.data;
    },
    enabled: query.length >= 2,
  });

  const users = data?.users || [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isError) {
    debug.error('User search error:', error);
    return (
      <div className="text-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <p className="text-destructive font-medium mb-2">An error occurred while loading users.</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Please try again later.'}
        </p>
        {/* Add a sign-in button if the error is related to authentication */}
        {error instanceof Error && error.message.includes('Unauthorized') && (
          <a
            href={`/login/google?from=${encodeURIComponent(window.location.href)}`}
            className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        )}
      </div>
    );
  }

  if (users.length === 0 && query.length >= 2) {
    return (
      <p className="text-center text-muted-foreground p-4">
        No users found for this query.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <UserResult key={user.id} user={user} />
      ))}
    </div>
  );
}

function UserResult({ user }: { user: UserData }) {
  const { user: loggedInUser, isLoggedIn } = useSession();

  const followerState: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: isLoggedIn ? !!user.followers.some(
      ({ followerId }) => followerId === loggedInUser?.id,
    ) : false,
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
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
            <p className="line-clamp-1 break-all font-semibold hover:underline">{user.displayName}</p>
            <p className="line-clamp-1 break-all text-muted-foreground">@{user.username}</p>
          </div>
        </Link>
      </UserTooltip>
      {isLoggedIn && (
        followerState.isFollowedByUser ? (
          <MessageButton userId={user.id} />
        ) : (
          <FollowButton userId={user.id} initialState={followerState} />
        )
      )}
    </div>
  );
}
