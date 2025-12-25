import { Prisma } from "@prisma/client";

export function getUserDataSelect(loggedInUserId: string) {
  // For guest users (empty loggedInUserId), we still need to include basic data
  // but we don't need to filter followers by user ID
  const isLoggedIn = !!loggedInUserId;

  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    gender: true,
    whatsappNumber: true,
    dateOfBirth: true,
    createdAt: true,
    onlineStatus: true,
    lastActiveAt: true,
    showOnlineStatus: true,
    isProfilePublic: true,
    showWhatsappNumber: true,
    showDob: true,
    hideYear: true,
    upiId: true,
    showUpiId: true,
    socialLinks: true,
    // Modeling feature fields
    interestedInModeling: true,
    photoshootPricePerDay: true,
    videoAdsParticipation: true,
    // Brand Ambassadorship feature fields
    interestedInBrandAmbassadorship: true,
    brandAmbassadorshipPricing: true,
    brandPreferences: true,
    // Explicitly exclude role from the response
    role: false,
    followers: isLoggedIn ? {
      where: {
        followerId: loggedInUserId,
      },
      select: {
        followerId: true,
      },
    } : {
      where: {
        followerId: '', // This will return an empty array
      },
      select: {
        followerId: true,
      },
    },
    _count: {
      select: {
        posts: true,
        followers: true,
      },
    },
  } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

export function getPostDataInclude(loggedInUserId: string) {
  // For guest users (empty loggedInUserId), we still need to include basic data
  // but we don't need to filter likes/bookmarks by user ID
  const isLoggedIn = !!loggedInUserId;

  return {
    user: {
      select: getUserDataSelect(loggedInUserId || ''), // Pass empty string for guest users
    },
    attachments: {
      include: {
        appliedPromotionSticker: true,
      },
    },
    // For guest users, include empty arrays for likes and bookmarks
    likes: isLoggedIn ? {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
    } : {
      where: {
        userId: '', // This will return an empty array
      },
      select: {
        userId: true,
      },
    },
    bookmarks: isLoggedIn ? {
      where: {
        userId: loggedInUserId,
      },
      select: {
        userId: true,
      },
    } : {
      where: {
        userId: '', // This will return an empty array
      },
      select: {
        userId: true,
      },
    },
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
