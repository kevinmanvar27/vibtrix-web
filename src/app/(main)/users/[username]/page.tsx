import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserPosts from "./UserPosts";
import UserProfileClient from "./UserProfileClient";
import UnblockUserProfileButton from "./UnblockUserProfileButton";

// Metadata generation is handled below

interface PageProps {
  params: { username: string };
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  // Get the user
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: {
      ...getUserDataSelect(loggedInUserId),
      role: true, // Include role for filtering
    },
  });

  if (!user) notFound();

  // If the user is not a regular user (role is not "USER"),
  // and the logged-in user is not an admin or the same user,
  // don't allow access to the profile
  if (user.role !== "USER") {
    // Check if the logged-in user is the same user or has admin privileges
    if (!loggedInUserId || loggedInUserId !== user.id) {
      // For non-admin users, don't show profiles of non-USER roles
      notFound();
    }
  }

  return user;
});

export async function generateMetadata({
  params: { username },
}: PageProps): Promise<Metadata> {
  const { user: loggedInUser } = await validateRequest();
  const isLoggedIn = !!loggedInUser;

  // Get user data for both logged-in and guest users
  const user = await getUser(username, loggedInUser?.id || '');

  return {
    title: `${user.displayName} (@${user.username})`,
  };
}

export default async function Page({ params: { username } }: PageProps) {
  const { user: loggedInUser } = await validateRequest();
  const isLoggedIn = !!loggedInUser;

  // Handle both logged-in and guest users
  const user = await getUser(username, loggedInUser?.id || '');

  // Only check blocks if user is logged in
  const blockExists = isLoggedIn ? await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: loggedInUser.id,
        blockedId: user.id,
      },
    },
  }) : null;

  // Check if this user has blocked the current user
  const blockedByUser = isLoggedIn ? await prisma.userBlock.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: loggedInUser?.id,
      },
    },
  }) : null;

  // If the user has been blocked by the current user, show a message with unblock option
  if (blockExists) {
    return (
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-5">
          <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">You have blocked this user</h2>
            <p className="text-muted-foreground mb-4">
              You have blocked this user and cannot view their profile. Unblock them to view their profile again.
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2">
                <UnblockUserProfileButton
                  userId={user.id}
                  username={user.username}
                />
              </div>
            </div>
          </div>
        </div>
        <TrendsSidebar />
      </main>
    );
  }

  // If the current user has been blocked by this user
  if (blockedByUser) {
    return (
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-5">
          <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">You cannot view this profile</h2>
            <p className="text-muted-foreground mb-4">
              This user has blocked you and you cannot view their profile.
            </p>
          </div>
        </div>
        <TrendsSidebar />
      </main>
    );
  }

  // Get follow status and follow request status - only for logged-in users
  const isFollower = isLoggedIn ? user.followers.some(
    ({ followerId }) => followerId === loggedInUser.id
  ) : false;

  // Check for pending follow request - only for logged-in users
  const followRequest = isLoggedIn ? await prisma.followRequest.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: loggedInUser.id,
        recipientId: user.id,
      },
    },
    select: {
      status: true,
    },
  }) : null;

  const hasPendingRequest = followRequest?.status === "PENDING";

  // Pass the follower status to the component
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: isFollower,
  };

  // For non-logged-in users viewing any profile, show a view-only version
  if (!isLoggedIn) {
    return (
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-5">
          <UserProfileClient
            user={user}
            loggedInUserId=""
            followerInfo={followerInfo}
            isGuestView={true}
          />
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-center text-2xl font-bold">
              {user.displayName}&apos;s posts
            </h2>
          </div>
          <UserPosts userId={user.id} />
        </div>
        <TrendsSidebar />
      </main>
    );
  }

  // Check if the profile is private and not the logged-in user and not a follower
  if (!user.isProfilePublic && user.id !== loggedInUser.id && !isFollower) {
    // Show limited profile view for private accounts

    return (
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-5">
          <UserProfileClient
            user={user}
            loggedInUserId={loggedInUser.id}
            followerInfo={followerInfo}
            isPrivateProfile={true}
            hasPendingRequest={hasPendingRequest}
          />
          <div className="rounded-2xl bg-card p-8 shadow-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Private Profile</h2>
            <p className="text-muted-foreground mb-4">
              This account is private. Follow this account to see their photos and videos.
            </p>
          </div>
        </div>
        <TrendsSidebar />
      </main>
    );
  }

  // followerInfo is already defined above

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <UserProfileClient
          user={user}
          loggedInUserId={loggedInUser.id}
          followerInfo={followerInfo}
        />
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">
            {user.displayName}&apos;s posts
          </h2>
        </div>
        <UserPosts userId={user.id} />
      </div>
      <TrendsSidebar />
    </main>
  );
}


