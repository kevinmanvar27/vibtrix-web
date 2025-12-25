"use client";

import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserData } from "@/lib/types";
import { Ban, Search, ShieldAlert, UserX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BlockedUserUnblockButton from "./BlockedUserUnblockButton";

interface BlockedUsersClientProps {
  users: UserData[];
}

export default function BlockedUsersClient({ users: initialUsers }: BlockedUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");

  // Update the local state when the prop changes
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Handle unblock success by removing the user from the list
  const handleUnblockSuccess = (userId: string) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower)
    );
  });

  if (users.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b mb-6">
          <div>
            <h1 className="text-2xl font-bold">Blocked Users</h1>
            <p className="text-sm text-muted-foreground">Manage users you've blocked</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4 flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span className="text-base font-medium">Privacy Protection</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Blocked users cannot see your profile, posts, or send you messages
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-8 flex flex-col items-center justify-center min-h-[200px]">
            <div className="bg-muted/30 p-6 rounded-full mb-4">
              <UserX className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Blocked Users</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven&apos;t blocked any users yet. When you block someone, they&apos;ll appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blocked Users</h1>
          <p className="text-sm text-muted-foreground">Manage users you've blocked</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-4 flex flex-row items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span className="text-base font-medium">Privacy Protection</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Blocked users cannot see your profile, posts, or send you messages
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search blocked users..."
            className="pl-10 bg-background w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No users match your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-lg border p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    size={40}
                    className="flex-none"
                  />
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <BlockedUserUnblockButton
                  userId={user.id}
                  username={user.username}
                  onUnblock={handleUnblockSuccess}
                />
              </div>
            ))}

            <div className="text-center text-sm text-muted-foreground">
              <p>Showing {filteredUsers.length} of {users.length} blocked users</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
