import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { getMessageInclude } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

/**
 * Helper function to get authenticated user from either JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

/**
 * POST /api/messages
 * Send a direct message to a user (creates chat if needed)
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(request: NextRequest) {
  try {
    debug.log('POST /api/messages - Starting request');
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log('POST /api/messages - Unauthorized');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log('POST /api/messages - User authenticated:', user.id);

    // Check if messaging feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { messagingEnabled: true },
    });

    if (!settings?.messagingEnabled) {
      debug.log('POST /api/messages - Messaging feature is disabled');
      return Response.json({ error: "Messaging feature is currently disabled" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    debug.log('POST /api/messages - Request body:', body);

    const { recipientId, content } = body;

    // Validate input
    if (!recipientId || typeof recipientId !== "string") {
      debug.log('POST /api/messages - Invalid recipientId:', recipientId);
      return Response.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim() === "") {
      debug.log('POST /api/messages - Invalid content:', content);
      return Response.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isActive: true },
    });

    if (!recipient) {
      debug.log('POST /api/messages - Recipient not found:', recipientId);
      return Response.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    if (!recipient.isActive) {
      debug.log('POST /api/messages - Recipient is not active:', recipientId);
      return Response.json(
        { error: "Cannot send message to inactive user" },
        { status: 403 }
      );
    }

    // Check if user is blocked by recipient or has blocked recipient
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: recipientId },
          { blockerId: recipientId, blockedId: user.id },
        ],
      },
    });

    if (blockExists) {
      debug.log('POST /api/messages - Block exists between users');
      return Response.json(
        { error: "Cannot send message due to block" },
        { status: 403 }
      );
    }

    // Find existing chat between the two users or create a new one
    let chat = await prisma.chat.findFirst({
      where: {
        isGroupChat: false,
        participants: {
          every: {
            userId: {
              in: [user.id, recipientId],
            },
          },
        },
        AND: [
          {
            participants: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            participants: {
              some: {
                userId: recipientId,
              },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });

    // If no chat exists, create a new one
    if (!chat) {
      debug.log('POST /api/messages - Creating new chat');
      chat = await prisma.chat.create({
        data: {
          isGroupChat: false,
          participants: {
            create: [
              { userId: user.id },
              { userId: recipientId },
            ],
          },
        },
        include: {
          participants: true,
        },
      });
    }

    // Create the message
    let message;
    try {
      // Use a transaction for the message creation and related updates
      message = await prisma.$transaction(async (tx) => {
        // Create message
        const newMessage = await tx.message.create({
          data: {
            content,
            senderId: user.id,
            recipientId,
            chatId: chat!.id,
            isRead: false,
          },
          include: getMessageInclude(),
        });

        // Update chat's lastMessageAt
        await tx.chat.update({
          where: { id: chat!.id },
          data: { lastMessageAt: new Date() },
        });

        // Mark recipient as having unread messages
        await tx.chatParticipant.updateMany({
          where: {
            chatId: chat!.id,
            userId: recipientId,
          },
          data: {
            hasUnread: true,
          },
        });

        return newMessage;
      });

      debug.log('POST /api/messages - Message created successfully');
    } catch (txError) {
      debug.error("Transaction error:", txError);
      return Response.json(
        { error: txError instanceof Error ? txError.message : "Failed to send message" },
        { status: 500 }
      );
    }

    return Response.json(message);
  } catch (error) {
    debug.error("Error sending message:", error);
    return Response.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
