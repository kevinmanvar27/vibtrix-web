"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import apiClient from "@/lib/api-client";
import { UserData } from "@/lib/types";
import { Loader2, Search, Users } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/app/(main)/SessionProvider";
import FollowButton from "@/components/FollowButton";
import MessageButton from "@/app/(main)/search/MessageButton";
import UserTooltip from "@/components/UserTooltip";
import { OnlineStatus } from "@/lib/types/onlineStatus";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

interface UserListingClientProps {
  initialPage: number;
  initialOnlineStatus: string;
  initialGender: string;
}

interface UserListingResponse {
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

export default function UserListingClient({
  initialPage,
  initialOnlineStatus,
  initialGender,
}: UserListingClientProps) {
  const { isLoggedIn } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(initialPage);
  const [onlineStatus, setOnlineStatus] = useState(initialOnlineStatus || "all");
  const [gender, setGender] = useState(initialGender || "all");
  const [searchQuery, setSearchQuery] = useState("");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    if (onlineStatus && onlineStatus !== "all") {
      params.set("onlineStatus", onlineStatus);
    } else {
      params.delete("onlineStatus");
    }

    if (gender && gender !== "all") {
      params.set("gender", gender);
    } else {
      params.delete("gender");
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [page, onlineStatus, gender, pathname, router, searchParams]);

  const { data, isLoading, isError } = useQuery<UserListingResponse>({
    queryKey: ["users-listing", page, onlineStatus, gender],
    queryFn: async (): Promise<UserListingResponse> => {
      const response = await apiClient.get("/api/users/recently-joined", {
        params: {
          page,
          limit: 12,
          ...(onlineStatus && onlineStatus !== "all" && { onlineStatus }),
          ...(gender && gender !== "all" && { gender }),
        }
      });
      return response.data as UserListingResponse;
    },
  });

  // Filter users by search query locally
  const filteredUsers = data?.users.filter(user => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  }) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled locally, no need to submit
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-center text-muted-foreground p-4">
          Unable to load users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={onlineStatus}
              onValueChange={setOnlineStatus}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Online Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={OnlineStatus.ONLINE}>Online</SelectItem>
                <SelectItem value={OnlineStatus.IDLE}>Idle</SelectItem>
                <SelectItem value={OnlineStatus.OFFLINE}>Offline</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={gender}
              onValueChange={setGender}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No Users Found</h2>
          <p className="text-muted-foreground">
            Try adjusting your filters or search criteria
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 mb-4 border-b">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-[50px]"></div>
              <div className="flex-1">
                <h3 className="font-semibold">User</h3>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center w-16">
                  <p className="font-semibold">Posts</p>
                </div>
                <div className="text-center w-16">
                  <p className="font-semibold">Followers</p>
                </div>
              </div>
            </div>
            <div className="w-[100px] text-center">
              <p className="font-semibold">Action</p>
            </div>
          </div>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  {data.pagination.hasPreviousPage && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(page - 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                    .filter(pageNum => {
                      // Show first page, last page, current page, and pages around current page
                      return (
                        pageNum === 1 ||
                        pageNum === data.pagination.totalPages ||
                        Math.abs(pageNum - page) <= 1
                      );
                    })
                    .map((pageNum, index, array) => {
                      // Add ellipsis if there are gaps
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && pageNum - prevPage > 1;

                      return (
                        <div key={pageNum} className="flex items-center">
                          {showEllipsis && (
                            <PaginationItem>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pageNum === page}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        </div>
                      );
                    })}

                  {data.pagination.hasNextPage && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface UserCardProps {
  user: UserData;
}

function UserCard({ user }: UserCardProps) {
  const { user: loggedInUser, isLoggedIn } = useSession();

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <UserTooltip user={user}>
          <Link href={`/users/${user.username}`}>
            <UserAvatar
              avatarUrl={user.avatarUrl}
              size={50}
              className="flex-none"
              showStatus={loggedInUser?.id === user.id || user.showOnlineStatus}
              status={user.onlineStatus as any}
              statusSize="sm"
            />
          </Link>
        </UserTooltip>

        <div className="flex-1 min-w-0">
          <Link href={`/users/${user.username}`} className="hover:underline">
            <h3 className="font-semibold truncate">{user.displayName}</h3>
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          </Link>

          {user.bio && (
            <p className="text-sm mt-1 line-clamp-1 text-muted-foreground">{user.bio}</p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-center w-16">
            <p className="font-semibold">{user._count.posts}</p>
          </div>
          <div className="text-center w-16">
            <p className="font-semibold">{user._count.followers}</p>
          </div>
        </div>
      </div>

      <div className="w-[100px] flex justify-center">
        {isLoggedIn ? (
          // Check if the current user is following this user
          user.followers && user.followers.length > 0 ? (
            // If following, show message button
            <MessageButton userId={user.id} />
          ) : (
            // If not following, show follow button
            <FollowButton
              userId={user.id}
              initialState={{
                isFollowedByUser: false, // Not following
                followers: user._count.followers
              }}
            />
          )
        ) : (
          // For non-logged in users
          <Button variant="outline" size="sm" disabled={!isLoggedIn}>
            Follow
          </Button>
        )}
      </div>
    </div>
  );
}
