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
 * POST /api/chats/{chatId}/read
 * Mark chat as read (updates unread count)
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

    // Update unread count and last read time
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

    debug.log(`✅ Marked chat ${chatId} as read for user ${user.id}`);

    return Response.json({ 
      success: true,
      message: "Chat marked as read" 
    });
  } catch (error) {
    debug.error("Error marking chat as read:", error);
    return Response.json(
      { error: "Failed to mark chat as read" },
      { status: 500 }
    );
  }
}
