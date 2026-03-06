/**
 * IDOR (Insecure Direct Object Reference) Protection Middleware
 * Ensures users can only access resources they own or have permission to view
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from './prisma';
import debug from './debug';
import { validateRequest } from '@/auth';

/**
 * Resource types that need IDOR protection
 */
export type ResourceType = 
  | 'post'
  | 'comment'
  | 'chat'
  | 'message'
  | 'competition'
  | 'user'
  | 'notification'
  | 'bookmark'
  | 'payment';

/**
 * Permission levels
 */
export type PermissionLevel = 'read' | 'write' | 'delete' | 'admin';

/**
 * Check if user has access to a specific resource
 * This is the main IDOR protection function
 */
export async function checkResourceAccess(options: {
  resourceId: string;
  resourceType: ResourceType;
  userId: string;
  permission?: PermissionLevel;
}): Promise<{
  hasAccess: boolean;
  reason?: string;
  resource?: any;
}> {
  const { resourceId, resourceType, userId, permission = 'read' } = options;
  
  try {
    // Admin override - admins can access everything
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, role: true },
    });
    
    if (requestingUser?.isAdmin || requestingUser?.role === 'SUPER_ADMIN') {
      return { hasAccess: true, reason: 'Admin access' };
    }
    
    // Check based on resource type
    switch (resourceType) {
      case 'post':
        return await checkPostAccess(resourceId, userId, permission);
      
      case 'comment':
        return await checkCommentAccess(resourceId, userId, permission);
      
      case 'chat':
        return await checkChatAccess(resourceId, userId, permission);
      
      case 'message':
        return await checkMessageAccess(resourceId, userId, permission);
      
      case 'competition':
        return await checkCompetitionAccess(resourceId, userId, permission);
      
      case 'user':
        return await checkUserAccess(resourceId, userId, permission);
      
      case 'notification':
        return await checkNotificationAccess(resourceId, userId, permission);
      
      case 'bookmark':
        return await checkBookmarkAccess(resourceId, userId, permission);
      
      case 'payment':
        return await checkPaymentAccess(resourceId, userId, permission);
      
      default:
        return { 
          hasAccess: false, 
          reason: `Unknown resource type: ${resourceType}` 
        };
    }
  } catch (error) {
    debug.error('Error checking resource access:', error);
    return { 
      hasAccess: false, 
      reason: 'Failed to verify access permissions' 
    };
  }
}

/**
 * Post access check
 */
async function checkPostAccess(
  postId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          isProfilePublic: true,
          followers: {
            where: { followerId: userId },
          },
        },
      },
    },
  });
  
  if (!post) {
    return { hasAccess: false, reason: 'Post not found' };
  }
  
  // Owner can always access their own posts
  if (post.userId === userId) {
    return { hasAccess: true, resource: post };
  }
  
  // For now, all posts are accessible (no visibility field in schema)
  // This can be extended when visibility is added
  
  // Write/delete permissions require ownership
  if (permission !== 'read') {
    return { hasAccess: false, reason: 'You can only modify your own posts' };
  }
  
  return { hasAccess: true, resource: post };
}

/**
 * Comment access check
 */
async function checkCommentAccess(
  commentId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: true,
      post: {
        include: {
          user: {
            select: { id: true },
          },
        },
      },
    },
  });
  
  if (!comment) {
    return { hasAccess: false, reason: 'Comment not found' };
  }
  
  // Owner can access their own comments
  if (comment.userId === userId) {
    return { hasAccess: true, resource: comment };
  }
  
  // Post owner can access comments on their post
  if (comment.post.user.id === userId) {
    return { hasAccess: true, resource: comment };
  }
  
  // Check if user can access the post
  const postAccess = await checkPostAccess(comment.postId, userId, 'read');
  if (!postAccess.hasAccess) {
    return { hasAccess: false, reason: 'You cannot access comments on this post' };
  }
  
  // Write/delete requires ownership
  if (permission !== 'read') {
    return { hasAccess: false, reason: 'You can only modify your own comments' };
  }
  
  return { hasAccess: true, resource: comment };
}

/**
 * Chat access check
 */
async function checkChatAccess(
  chatId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      participants: {
        where: { userId },
      },
    },
  });
  
  if (!chat) {
    return { hasAccess: false, reason: 'Chat not found' };
  }
  
  // Only participants can access chat
  if (chat.participants.length === 0) {
    return { hasAccess: false, reason: 'You are not a participant in this chat' };
  }
  
  // Admin/modification requires special permissions
  if (permission !== 'read') {
    // For now, allow chat participants to modify
    // Can be extended with creator tracking
    return { hasAccess: true, resource: chat };
  }
  
  return { hasAccess: true, resource: chat };
}

/**
 * Message access check
 */
async function checkMessageAccess(
  messageId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      chat: {
        include: {
          participants: {
            where: { userId },
          },
        },
      },
    },
  });
  
  if (!message) {
    return { hasAccess: false, reason: 'Message not found' };
  }
  
  // Check if user is participant in the chat
  if (message.chat.participants.length === 0) {
    return { hasAccess: false, reason: 'You cannot access messages in this chat' };
  }
  
  // Only sender can delete messages
  if (permission === 'delete' && message.senderId !== userId) {
    return { hasAccess: false, reason: 'You can only delete your own messages' };
  }
  
  return { hasAccess: true, resource: message };
}

/**
 * Competition access check
 */
async function checkCompetitionAccess(
  competitionId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });
  
  if (!competition) {
    return { hasAccess: false, reason: 'Competition not found' };
  }
  
  // Public competitions are readable by everyone
  // Note: visibility field not in schema, assuming public by default
  if (permission === 'read') {
    return { hasAccess: true, resource: competition };
  }
  
  // Participants can access competitions they joined
  const participation = await prisma.competitionParticipant.findFirst({
    where: {
      competitionId,
      userId,
    },
  });
  
  if (participation) {
    return { hasAccess: true, resource: competition };
  }
  
  // Admin/organizer access for write/delete operations
  // Note: organizerId field not in schema - can be added later
  // For now, only read access is allowed for non-participants
  
  return { hasAccess: false, reason: 'You do not have access to this competition' };
}

/**
 * User profile access check
 */
async function checkUserAccess(
  userId: string,
  requesterId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isProfilePublic: true,
      followers: {
        where: { followerId: requesterId },
      },
    },
  });
  
  if (!user) {
    return { hasAccess: false, reason: 'User not found' };
  }
  
  // Users can always access their own profile
  if (userId === requesterId) {
    return { hasAccess: true, resource: user };
  }
  
  // Public profiles are accessible to everyone
  if (user.isProfilePublic) {
    return { hasAccess: true, resource: user };
  }
  
  // Private profiles - only followers can access
  if (user.followers.length > 0) {
    return { hasAccess: true, resource: user };
  }
  
  // Write access (following, messaging) requires different checks
  if (permission !== 'read') {
    return { hasAccess: true }; // Allow follow/message requests
  }
  
  return { hasAccess: false, reason: 'This profile is private' };
}

/**
 * Notification access check
 */
async function checkNotificationAccess(
  notificationId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  
  if (!notification) {
    return { hasAccess: false, reason: 'Notification not found' };
  }
  
  // Only recipient can access their notifications
  if (notification.recipientId !== userId) {
    return { hasAccess: false, reason: 'You can only access your own notifications' };
  }
  
  // Only recipient can mark as read/delete
  if (permission !== 'read') {
    return { hasAccess: false, reason: 'You can only manage your own notifications' };
  }
  
  return { hasAccess: true, resource: notification };
}

/**
 * Bookmark access check
 */
async function checkBookmarkAccess(
  bookmarkId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const bookmark = await prisma.bookmark.findUnique({
    where: { id: bookmarkId },
  });
  
  if (!bookmark) {
    return { hasAccess: false, reason: 'Bookmark not found' };
  }
  
  // Only owner can access bookmarks
  if (bookmark.userId !== userId) {
    return { hasAccess: false, reason: 'You can only access your own bookmarks' };
  }
  
  return { hasAccess: true, resource: bookmark };
}

/**
 * Payment access check
 */
async function checkPaymentAccess(
  paymentId: string,
  userId: string,
  permission: PermissionLevel
): Promise<{ hasAccess: boolean; reason?: string; resource?: any }> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  
  if (!payment) {
    return { hasAccess: false, reason: 'Payment not found' };
  }
  
  // Only payer or admin can access payment details
  if (payment.userId !== userId) {
    return { hasAccess: false, reason: 'You can only access your own payments' };
  }
  
  return { hasAccess: true, resource: payment };
}

/**
 * Higher-order function to wrap API route handlers with IDOR protection
 */
export function withIDORProtection<T extends ResourceType>(options: {
  resourceType: T;
  permission?: PermissionLevel;
  getIdFromRequest: (request: NextRequest) => string;
}) {
  return function handler(
    handler: (
      request: NextRequest,
      params: { resource: any; userId: string }
    ) => Promise<Response>
  ) {
    return async function protectedHandler(request: NextRequest): Promise<Response> {
      // Get authenticated user
      const auth = await validateRequest();
      
      if (!auth.user) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Get resource ID from request
      const resourceId = options.getIdFromRequest(request);
      
      if (!resourceId) {
        return Response.json(
          { error: 'Resource ID required' },
          { status: 400 }
        );
      }
      
      // Check access
      const accessCheck = await checkResourceAccess({
        resourceId,
        resourceType: options.resourceType,
        userId: auth.user.id,
        permission: options.permission || 'read',
      });
      
      if (!accessCheck.hasAccess) {
        // Return 404 instead of 403 to avoid revealing resource existence
        return Response.json(
          { error: 'Resource not found' },
          { status: 404 }
        );
      }
      
      // Call original handler with resource and user info
      return handler(request, {
        resource: accessCheck.resource,
        userId: auth.user.id,
      });
    };
  };
}
