import prisma from "@/lib/prisma";
import { getChatInclude } from "@/lib/types";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

/**
 * PATCH /api/message-requests/[requestId]
 * Accept or reject a message request
 * Body: { action: "accept" | "reject" }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();
    const { action } = body; // "accept" | "reject"

    if (!action || !["accept", "reject"].includes(action)) {
      return Response.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 });
    }

    // Find the request and verify the current user is the recipient
    const messageRequest = await prisma.messageRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });

    if (!messageRequest) {
      return Response.json({ error: "Message request not found" }, { status: 404 });
    }

    if (messageRequest.recipientId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (messageRequest.status !== "PENDING") {
      return Response.json({ error: "Request already handled" }, { status: 400 });
    }

    if (action === "reject") {
      const updated = await prisma.messageRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      return Response.json(updated);
    }

    // Accept: create a chat between sender and recipient
    const participantIds = [messageRequest.senderId, user.id];

    // Check if a direct chat already exists between these two users
    const userChats = await prisma.chat.findMany({
      where: {
        isGroupChat: false,
        participants: { some: { userId: user.id } },
      },
      include: { participants: { select: { userId: true } } },
    });

    let chatId: string;

    const existingChat = userChats.find((chat) => {
      if (chat.participants.length !== 2) return false;
      const ids = chat.participants.map((p) => p.userId);
      return participantIds.every((id) => ids.includes(id));
    });

    if (existingChat) {
      chatId = existingChat.id;
    } else {
      const newChat = await prisma.chat.create({
        data: {
          isGroupChat: false,
          participants: {
            create: participantIds.map((userId) => ({ userId })),
          },
        },
      });
      chatId = newChat.id;
    }

    // Update the message request to accepted and link the chat
    const updated = await prisma.messageRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED", chatId },
    });

    // Return the chat with full details
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: getChatInclude(user.id),
    });

    return Response.json({ request: updated, chat });
  } catch (error) {
    debug.error("Error handling message request:", error);
    return Response.json({ error: "Failed to handle message request" }, { status: 500 });
  }
}

/**
 * DELETE /api/message-requests/[requestId]
 * Delete/cancel a message request (by sender)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;

    const messageRequest = await prisma.messageRequest.findUnique({
      where: { id: requestId },
    });

    if (!messageRequest) {
      return Response.json({ error: "Message request not found" }, { status: 404 });
    }

    if (messageRequest.senderId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.messageRequest.delete({ where: { id: requestId } });

    return Response.json({ message: "Message request cancelled" });
  } catch (error) {
    debug.error("Error deleting message request:", error);
    return Response.json({ error: "Failed to cancel message request" }, { status: 500 });
  }
}
