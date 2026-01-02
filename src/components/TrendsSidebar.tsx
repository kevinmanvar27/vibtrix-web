import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { OnlineStatus } from "@/lib/types/onlineStatus";
import { formatNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import UserTooltip from "./UserTooltip";
import RecentlyJoinedSidebarWrapper from "./RecentlyJoinedSidebarWrapper";

import debug from "@/lib/debug";

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <RecentlyJoinedSidebarWrapper />
      </Suspense>
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  try {
    const { user } = await validateRequest();

    if (!user) return null;

    const usersToFollow = await prisma.user.findMany({
      where: {
        NOT: {
          id: user.id,
        },
        followers: {
          none: {
            followerId: user.id,
          },
        },
        isActive: true,
      },
      select: getUserDataSelect(user.id),
      take: 5,
    });

    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Who to follow</div>
        {usersToFollow.length > 0 ? (
          usersToFollow.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3">
              <UserTooltip user={user}>
                <Link
                  href={`/users/${user.username}`}
                  className="flex items-center gap-3"
                >
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    className="flex-none"
                    showStatus={true}
                    status={(user.onlineStatus as OnlineStatus) || OnlineStatus.OFFLINE}
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
              <FollowButton
                userId={user.id}
                initialState={{
                  followers: user._count.followers,
                  isFollowedByUser: user.followers.some(
                    ({ followerId }) => followerId === user.id,
                  ),
                }}
              />
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No users to follow at the moment.</p>
        )}
      </div>
    );
  } catch (error) {
    debug.error("Error in WhoToFollow component:", error);
    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Who to follow</div>
        <p className="text-muted-foreground">Unable to load user recommendations.</p>
      </div>
    );
  }
}

const getTrendingTopics = unstable_cache(
  async () => {
    try {
      // First check if the posts table exists and has data
      const postCount = await prisma.post.count();

      if (postCount === 0) {
        return [];
      }

      // MySQL version: Extract hashtags using SUBSTRING_INDEX and a recursive approach
      // For MySQL, we'll use a different approach - fetch posts and extract hashtags in JS
      const posts = await prisma.post.findMany({
        select: { content: true },
        take: 1000, // Limit to recent posts for performance
        orderBy: { createdAt: 'desc' }
      });

      // Extract hashtags from posts content
      const hashtagCounts = new Map<string, number>();
      const hashtagRegex = /#[a-zA-Z0-9_]+/g;
      
      for (const post of posts) {
        const matches = post.content.match(hashtagRegex);
        if (matches) {
          for (const match of matches) {
            const hashtag = match.toLowerCase();
            hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
          }
        }
      }

      // Sort by count and get top 5
      const result = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([hashtag, count]) => ({ hashtag, count: BigInt(count) }));

      return result.map((row) => ({
        hashtag: row.hashtag,
        count: Number(row.count),
      }));
    } catch (error) {
      debug.error("Error fetching trending topics:", error);
      return [];
    }
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  try {
    const trendingTopics = await getTrendingTopics();

    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Trending topics</div>
        {trendingTopics.length > 0 ? (
          trendingTopics.map(({ hashtag, count }) => {
            const title = hashtag.split("#")[1];

            return (
              <Link key={title} href={`/hashtag/${title}`} className="block">
                <p
                  className="line-clamp-1 break-all font-semibold hover:underline"
                  title={hashtag}
                >
                  {hashtag}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(count)} {count === 1 ? "post" : "posts"}
                </p>
              </Link>
            );
          })
        ) : (
          <p className="text-muted-foreground">No trending topics yet. Start posting with hashtags!</p>
        )}
      </div>
    );
  } catch (error) {
    debug.error("Error in TrendingTopics component:", error);
    return (
      <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
        <div className="text-xl font-bold">Trending topics</div>
        <p className="text-muted-foreground">Unable to load trending topics.</p>
      </div>
    );
  }
}
