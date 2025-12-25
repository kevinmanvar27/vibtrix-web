import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { getChatInclude } from "@/lib/types";
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
 * GET /api/chats
 * Get all chats for the authenticated user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = request.nextUrl.searchParams.get("cursor");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    // Get the list of users that the current user has blocked
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        blockerId: user.id,
      },
      select: {
        blockedId: true,
      },
    });

    // Get the list of users that have blocked the current user
    const blockedByUsers = await prisma.userBlock.findMany({
      where: {
        blockedId: user.id,
      },
      select: {
        blockerId: true,
      },
    });

    // Extract just the IDs from the results
    const blockedUserIds = blockedUsers.map((block) => block.blockedId);
    const blockedByUserIds = blockedByUsers.map((block) => block.blockerId);

    // Combine both lists to exclude from chat results
    const excludedUserIds = [...blockedUserIds, ...blockedByUserIds];

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
        // For non-group chats, exclude chats with blocked users
        ...(excludedUserIds.length > 0 && {
          OR: [
            { isGroupChat: true },
            {
              isGroupChat: false,
              participants: {
                none: {
                  userId: {
                    in: excludedUserIds,
                  },
                },
              },
            },
          ],
        }),
      },
      include: getChatInclude(user.id),
      orderBy: {
        lastMessageAt: "desc",
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
    });

    let nextCursor: string | null = null;
    if (chats.length > limit) {
      const nextItem = chats.pop();
      nextCursor = nextItem!.id;
    }

    return Response.json({
      chats,
      nextCursor,
    });
  } catch (error) {
    debug.error("Error fetching chats:", error);
    return Response.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats
 * Create a new chat or return existing chat
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(request: NextRequest) {
  try {
    debug.log('POST /api/chats - Starting request');
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      debug.log('POST /api/chats - Unauthorized');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log('POST /api/chats - User authenticated:', user.id);

    // Parse request body
    const body = await request.json();
    debug.log('POST /api/chats - Request body:', body);

    const { participantIds, name, isGroupChat } = body;

    // Validate participants
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      debug.log('POST /api/chats - Invalid participants:', participantIds);
      return Response.json(
        { error: "At least one participant is required" },
        { status: 400 }
      );
    }

    debug.log('POST /api/chats - Valid participants:', participantIds);

    // Check for blocked users
    for (const participantId of participantIds) {
      if (participantId === user.id) continue;

      // Check if the current user has blocked this participant
      const blockExists = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: participantId,
          },
        },
      });

      if (blockExists) {
        return Response.json(
          { error: "Cannot create chat with a blocked user" },
          { status: 403 }
        );
      }

      // Check if this participant has blocked the current user
      const blockedByUser = await prisma.userBlock.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: participantId,
            blockedId: user.id,
          },
        },
      });

      if (blockedByUser) {
        return Response.json(
          { error: "Cannot create chat with this user" },
          { status: 403 }
        );
      }
    }

    // Add the current user to participants if not already included
    if (!participantIds.includes(user.id)) {
      participantIds.push(user.id);
    }

    // For direct messages (not group chats), check if a chat already exists
    if (!isGroupChat && participantIds.length === 2) {
      // Get all chats where the current user is a participant
      const userChats = await prisma.chat.findMany({
        where: {
          isGroupChat: false,
          participants: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          participants: {
            select: {
              userId: true
            }
          }
        }
      });

      // Find a chat that has exactly these two participants
      const existingChat = userChats.find(chat => {
        if (chat.participants.length !== 2) return false;

        const participantUserIds = chat.participants.map(p => p.userId);
        return participantIds.every(id => participantUserIds.includes(id)) &&
          participantUserIds.every(id => participantIds.includes(id));
      });

      if (existingChat) {
        // Return the chat with full details
        const chatWithDetails = await prisma.chat.findUnique({
          where: { id: existingChat.id },
          include: getChatInclude(user.id),
        });

        return Response.json(chatWithDetails);
      }
    }

    // Create a new chat
    debug.log('POST /api/chats - Creating new chat');
    try {
      const chat = await prisma.chat.create({
        data: {
          name: name || null,
          isGroupChat: isGroupChat || false,
          participants: {
            create: participantIds.map((userId: string) => ({
              userId,
            })),
          },
        },
        include: getChatInclude(user.id),
      });

      debug.log('POST /api/chats - Chat created successfully:', chat.id);
      return Response.json(chat);
    } catch (createError) {
      debug.error('POST /api/chats - Error creating chat:', createError);
      return Response.json(
        { error: createError instanceof Error ? createError.message : "Failed to create chat" },
        { status: 500 }
      );
    }
  } catch (error) {
    debug.error("Error creating chat:", error);
    return Response.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
