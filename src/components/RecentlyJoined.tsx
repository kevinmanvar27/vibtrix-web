"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { UserData } from "@/lib/types";
import { Loader2, Users } from "lucide-react";
import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { Button } from "./ui/button";
import { useSession } from "@/app/(main)/SessionProvider";

interface RecentlyJoinedResponse {
  users: UserData[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function RecentlyJoined() {
  const { isLoggedIn } = useSession();

  const { data, isLoading, isError } = useQuery<RecentlyJoinedResponse>({
    queryKey: ["recently-joined-users"],
    queryFn: async () => {
      const response = await apiClient.get("/api/users/recently-joined", {
        params: { limit: 6 }
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Recently Joined</h2>
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Recently Joined</h2>
        <p className="text-center text-muted-foreground p-4">
          Unable to load recently joined users.
        </p>
      </div>
    );
  }

  const { users } = data;

  if (users.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Recently Joined</h2>
        <p className="text-center text-muted-foreground p-4">
          No users found.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recently Joined</h2>
        <Link href="/users">
          <Button variant="ghost" size="sm">
            View More
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {users.map((user) => (
          <Link 
            key={user.id} 
            href={`/users/${user.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <UserAvatar
              avatarUrl={user.avatarUrl}
              className="flex-none"
              showStatus={true}
              status={user.onlineStatus}
              statusSize="sm"
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{user.displayName}</p>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
            </div>
          </Link>
        ))}
      </div>
      
      {data.pagination.totalCount > 6 && (
        <div className="mt-4 text-center">
          <Link href="/users">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              View All Users
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
