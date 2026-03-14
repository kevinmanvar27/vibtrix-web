import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

interface RouteParams {
  params: {
    chatId: string;
  };
}

/**
 * POST /api/chats/{chatId}/read-all
 * Mark all messages in a chat as read
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(
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

    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: {
          not: user.id, // Don't mark own messages
        },
        readAt: null, // Only unread messages
      },
      data: {
        readAt: new Date(),
      },
    });

    // Update unread count for this participant
    await prisma.chatParticipant.update({
      where: {
        userId_chatId: {
          userId: user.id,
          chatId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    debug.log(`✅ Marked all messages as read in chat ${chatId} for user ${user.id}`);

    return Response.json({ 
      success: true,
      message: "All messages marked as read" 
    });
  } catch (error) {
    debug.error("Error marking messages as read:", error);
    return Response.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
