import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId: string) {
  // OPTIMIZATION: Simplified user data selection - removed unnecessary fields
  // For guest users (empty loggedInUserId), we still need to include basic data
  const isLoggedIn = !!loggedInUserId;

  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    // OPTIMIZATION: Removed heavy fields that are rarely used in feed
    // bio: true,
    // gender: true,
    // whatsappNumber: true,
    // dateOfBirth: true,
    createdAt: true,
    // onlineStatus: true,
    // lastActiveAt: true,
    // showOnlineStatus: true,
    isProfilePublic: true,
    // showWhatsappNumber: true,
    // showDob: true,
    // hideYear: true,
    // upiId: true,
    // showUpiId: true,
    // socialLinks: true,
    // Modeling feature fields - removed for feed performance
    // interestedInModeling: true,
    // photoshootPricePerDay: true,
    // videoAdsParticipation: true,
    // Brand Ambassadorship feature fields - removed for feed performance
    // interestedInBrandAmbassadorship: true,
    // brandAmbassadorshipPricing: true,
    // brandPreferences: true,
    role: false,
    // OPTIMIZATION: Simplified followers check - only check if following
    followers: isLoggedIn ? {
      where: {
        followerId: loggedInUserId,
      },
      select: {
        followerId: true,
      },
    } : false,
    // OPTIMIZATION: Only get essential counts
    _count: {
      select: {
        // posts: true, // Removed - not needed in feed
        followers: true,
        // following: true, // Removed - not needed in feed
      },
    },
  } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

export function getPostDataInclude(loggedInUserId: string) {
  // OPTIMIZATION: Simplified post data inclusion for faster queries
  // For guest users (empty loggedInUserId), we still need to include basic data
  const isLoggedIn = !!loggedInUserId;

  return {
    user: {
      select: getUserDataSelect(loggedInUserId || ''),
    },
    // OPTIMIZATION: Simplified attachments - removed nested sticker data
    attachments: true,
    // OPTIMIZATION: Only fetch user's own likes/bookmarks
    likes: isLoggedIn ? {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
      take: 1, // OPTIMIZATION: Only need to know if user liked it
    } : false,
    bookmarks: isLoggedIn ? {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
      take: 1, // OPTIMIZATION: Only need to know if user bookmarked it
    } : false,
    // OPTIMIZATION: Only get essential counts
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  } satisfies Prisma.PostInclude;
}

export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

export function getCommentDataInclude(loggedInUserId: string) {
  return {
    user: {
      select: getUserDataSelect(loggedInUserId),
    },
  } satisfies Prisma.CommentInclude;
}

export type CommentData = Prisma.CommentGetPayload<{
  include: ReturnType<typeof getCommentDataInclude>;
}>;

export interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

export const notificationsInclude = {
  issuer: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  post: {
    select: {
      content: true,
    },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof notificationsInclude;
}>;

export interface NotificationsPage {
  notifications: NotificationData[];
  nextCursor: string | null;
}

export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

export interface NotificationCountInfo {
  unreadCount: number;
}

export interface MessageCountInfo {
  unreadCount: number;
}

export function getChatParticipantInclude(loggedInUserId: string) {
  return {
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        onlineStatus: true,
        showOnlineStatus: true,
      },
    },
  } satisfies Prisma.ChatParticipantInclude;
}

export function getChatInclude(loggedInUserId: string) {
  return {
    participants: {
      include: getChatParticipantInclude(loggedInUserId),
    },
    messages: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    },
  } satisfies Prisma.ChatInclude;
}

export type ChatData = Prisma.ChatGetPayload<{
  include: ReturnType<typeof getChatInclude>;
}>;

export interface ChatsPage {
  chats: ChatData[];
  nextCursor: string | null;
}

export function getMessageInclude() {
  return {
    sender: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    },
    recipient: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    },
  } satisfies Prisma.MessageInclude;
}

export type MessageData = Prisma.MessageGetPayload<{
  include: ReturnType<typeof getMessageInclude>;
}>;

export interface MessagesPage {
  messages: MessageData[];
  previousCursor: string | null;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}
