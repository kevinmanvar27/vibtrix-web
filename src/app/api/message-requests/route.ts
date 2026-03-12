import prisma from "@/lib/prisma";
import { getChatInclude } from "@/lib/types";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

/**
 * GET /api/message-requests
 * Get all pending message requests for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.messageRequest.findMany({
      where: {
        recipientId: user.id,
        status: "PENDING",
      },
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
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ requests });
  } catch (error) {
    debug.error("Error fetching message requests:", error);
    return Response.json({ error: "Failed to fetch message requests" }, { status: 500 });
  }
}

/**
 * POST /api/message-requests
 * Send a message request to a private profile user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId } = body;

    if (!recipientId) {
      return Response.json({ error: "recipientId is required" }, { status: 400 });
    }

    if (recipientId === user.id) {
      return Response.json({ error: "Cannot send message request to yourself" }, { status: 400 });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isProfilePublic: true },
    });

    if (!recipient) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check for blocks
    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: recipientId },
          { blockerId: recipientId, blockedId: user.id },
        ],
      },
    });

    if (blockExists) {
      return Response.json({ error: "Cannot send message request to this user" }, { status: 403 });
    }

    // Check if a request already exists
    const existingRequest = await prisma.messageRequest.findUnique({
      where: {
        senderId_recipientId: {
          senderId: user.id,
          recipientId,
        },
      },
    });

    if (existingRequest) {
      return Response.json(existingRequest);
    }

    const messageRequest = await prisma.messageRequest.create({
      data: {
        senderId: user.id,
        recipientId,
        status: "PENDING",
      },
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
    });

    return Response.json(messageRequest);
  } catch (error) {
    debug.error("Error creating message request:", error);
    return Response.json({ error: "Failed to send message request" }, { status: 500 });
  }
}
