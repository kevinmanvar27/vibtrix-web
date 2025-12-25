import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { getChatInclude } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

interface RouteParams {
  params: {
    chatId: string;
  };
}

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
 * GET /api/chats/{chatId}
 * Get a specific chat by ID
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

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: getChatInclude(user.id),
    });

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    debug.error("Error fetching chat:", error);
    return Response.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chats/{chatId}
 * Leave or delete a chat
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get the chat to check if it's a group chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: true,
      },
    });

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    // For group chats, just remove the participant
    // For direct chats, delete the entire chat
    if (chat.isGroupChat) {
      // Remove the participant from the group
      await prisma.chatParticipant.delete({
        where: {
          userId_chatId: {
            userId: user.id,
            chatId,
          },
        },
      });

      return Response.json({ message: "Left the chat successfully" });
    } else {
      // For direct chats, delete the entire chat and all messages
      await prisma.$transaction([
        prisma.message.deleteMany({
          where: { chatId },
        }),
        prisma.chatParticipant.deleteMany({
          where: { chatId },
        }),
        prisma.chat.delete({
          where: { id: chatId },
        }),
      ]);

      return Response.json({ message: "Chat deleted successfully" });
    }
  } catch (error) {
    debug.error("Error deleting chat:", error);
    return Response.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
