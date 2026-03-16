import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

interface RouteParams {
  params: {
    chatId: string;
    messageId: string;
  };
}

/**
 * DELETE /api/chats/{chatId}/messages/{messageId}
 * Delete a message from a chat
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    debug.log(`DELETE /api/chats/${params.chatId}/messages/${params.messageId} - Starting request`);
    
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log(`DELETE /api/chats/${params.chatId}/messages/${params.messageId} - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, messageId } = params;

    // Check if messaging feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { messagingEnabled: true },
    });

    if (!settings?.messagingEnabled) {
      debug.log(`DELETE /api/chats/${chatId}/messages/${messageId} - Messaging feature is disabled`);
      return Response.json({ error: "Messaging feature is currently disabled" }, { status: 403 });
    }

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
      debug.log(`DELETE /api/chats/${chatId}/messages/${messageId} - User is not a participant`);
      return Response.json(
        { error: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        chatId: true,
      },
    });

    if (!message) {
      debug.log(`DELETE /api/chats/${chatId}/messages/${messageId} - Message not found`);
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify the message belongs to this chat
    if (message.chatId !== chatId) {
      debug.log(`DELETE /api/chats/${chatId}/messages/${messageId} - Message does not belong to this chat`);
      return Response.json(
        { error: "Message does not belong to this chat" },
        { status: 400 }
      );
    }

    // Only the sender can delete their own message
    if (message.senderId !== user.id) {
      debug.log(`DELETE /api/chats/${chatId}/messages/${messageId} - User is not the sender`);
      return Response.json(
        { error: "You can only delete your own messages" },
        { status: 403 }
      );
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    debug.log(`DELETE /api/chats/${chatId}/messages/${messageId} - Message deleted successfully`);

    return Response.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    debug.error(`DELETE /api/chats/${params.chatId}/messages/${params.messageId} - Error:`, error);
    return Response.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
