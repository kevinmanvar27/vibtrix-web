import prisma from "@/lib/prisma";
import { getMessageInclude } from "@/lib/types";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

interface RouteParams {
  params: {
    chatId: string;
  };
}

/**
 * GET /api/chats/{chatId}/messages
 * Get messages for a specific chat
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if messaging feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { messagingEnabled: true },
    });

    if (!settings?.messagingEnabled) {
      return Response.json({ error: "Messaging feature is currently disabled" }, { status: 403 });
    }

    const { chatId } = params;

    // Check if user is a participant in this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId: user.id,
          chatId,
        },
      },
    });

    if (!participant) {
      return Response.json(
        { error: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    const cursor = request.nextUrl.searchParams.get("cursor");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");

    const messages = await prisma.message.findMany({
      where: {
        chatId,
      },
      include: getMessageInclude(),
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
    });

    let previousCursor: string | null = null;
    if (messages.length > limit) {
      const previousItem = messages.pop();
      previousCursor = previousItem!.id;
    }

    // Mark messages as read - use transaction for atomicity
    try {
      await prisma.$transaction(async (tx) => {
        // Update the participant record
        await tx.chatParticipant.update({
          where: {
            userId_chatId: {
              userId: user.id,
              chatId,
            },
          },
          data: {
            hasUnread: false,
            lastReadAt: new Date(),
          },
        });

        // Mark all messages from other users as read
        await tx.message.updateMany({
          where: {
            chatId,
            senderId: {
              not: user.id,
            },
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });
      });
    } catch (error) {
      debug.error("Error marking messages as read:", error);
      // Continue even if marking as read fails
    }

    // Invalidate the unread count cache
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');

    return Response.json({
      messages: messages.reverse(), // Return in chronological order
      previousCursor,
    }, { headers });
  } catch (error) {
    debug.error("Error fetching messages:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats/{chatId}/messages
 * Send a message in a chat
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    debug.log(`POST /api/chats/${params.chatId}/messages - Starting request`);
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log(`POST /api/chats/${params.chatId}/messages - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if messaging feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { messagingEnabled: true },
    });

    if (!settings?.messagingEnabled) {
      debug.log(`POST /api/chats/${params.chatId}/messages - Messaging feature is disabled`);
      return Response.json({ error: "Messaging feature is currently disabled" }, { status: 403 });
    }

    debug.log(`POST /api/chats/${params.chatId}/messages - User authenticated:`, user.id);
    const { chatId } = params;

    // Parse request body
    const body = await request.json();
    debug.log(`POST /api/chats/${chatId}/messages - Request body:`, body);

    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      debug.log(`POST /api/chats/${chatId}/messages - Invalid content:`, content);
      return Response.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    debug.log(`POST /api/chats/${chatId}/messages - Valid content:`, content);

    // Check if user is a participant in this chat
    debug.log(`POST /api/chats/${chatId}/messages - Checking if user is a participant`);
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId: user.id,
          chatId,
        },
      },
    });

    if (!participant) {
      debug.log(`POST /api/chats/${chatId}/messages - User is not a participant`);
      return Response.json(
        { error: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    debug.log(`POST /api/chats/${chatId}/messages - User is a participant`);

    // Create the message
    let message;
    try {
      // Check if the chat exists
      const chatDetails = await prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          isGroupChat: true
        }
      });

      if (!chatDetails) {
        return Response.json({ error: "Chat not found" }, { status: 404 });
      }

      // For direct messages, determine the recipient
      let recipientId: string | null = null;

      // Get participants
      const participants = await prisma.chatParticipant.findMany({
        where: { chatId },
        select: { userId: true }
      });

      if (!chatDetails.isGroupChat && participants.length === 2) {
        // Find the other participant (not the sender)
        const otherParticipant = participants.find(p => p.userId !== user.id);
        if (otherParticipant) {
          recipientId = otherParticipant.userId;
        }
      }

      // Use a transaction for the message creation and related updates
      message = await prisma.$transaction(async (tx) => {
        // Create message
        const newMessage = await tx.message.create({
          data: {
            content,
            senderId: user.id,
            chatId,
            recipientId, // This can be null for group chats
            isRead: false, // Messages start as unread for the recipient
          },
          include: getMessageInclude(),
        });

        // Update chat's lastMessageAt
        await tx.chat.update({
          where: { id: chatId },
          data: { lastMessageAt: new Date() },
        });

        // Mark other participants as having unread messages
        await tx.chatParticipant.updateMany({
          where: {
            chatId,
            userId: {
              not: user.id,
            },
          },
          data: {
            hasUnread: true,
          },
        });

        return newMessage;
      });
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
