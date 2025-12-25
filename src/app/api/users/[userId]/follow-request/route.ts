import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET endpoint to check follow request status
export async function GET(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followRequest = await prisma.followRequest.findUnique({
      where: {
        requesterId_recipientId: {
          requesterId: loggedInUser.id,
          recipientId: userId,
        },
      },
      select: {
        status: true,
      },
    });

    return Response.json({ status: followRequest?.status || null });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to send a follow request
export async function POST(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the user exists and has a private profile
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
      select: { isProfilePublic: true },
    });

    if (!userToFollow) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If the profile is public, directly follow instead of creating a request
    if (userToFollow.isProfilePublic) {
      // Check if a notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          issuerId: loggedInUser.id,
          recipientId: userId,
          type: "FOLLOW",
        },
      });

      await prisma.$transaction([
        prisma.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: loggedInUser.id,
              followingId: userId,
            },
          },
          create: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
          update: {},
        }),
        // Only create notification if it doesn't exist
        ...(!existingNotification ? [
          prisma.notification.create({
            data: {
              issuerId: loggedInUser.id,
              recipientId: userId,
              type: "FOLLOW",
            },
          })
        ] : []),
      ]);

      return Response.json({ status: "FOLLOWED" });
    }

    // Create or update follow request
    // Check if a notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        issuerId: loggedInUser.id,
        recipientId: userId,
        type: "FOLLOW_REQUEST",
      },
    });

    await prisma.$transaction([
      prisma.followRequest.upsert({
        where: {
          requesterId_recipientId: {
            requesterId: loggedInUser.id,
            recipientId: userId,
          },
        },
        create: {
          requesterId: loggedInUser.id,
          recipientId: userId,
          status: "PENDING",
        },
        update: {
          status: "PENDING",
        },
      }),
      // Only create notification if it doesn't exist
      ...(!existingNotification ? [
        prisma.notification.create({
          data: {
            issuerId: loggedInUser.id,
            recipientId: userId,
            type: "FOLLOW_REQUEST",
          },
        })
      ] : []),
    ]);

    return Response.json({ status: "PENDING" });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE endpoint to cancel a follow request
export async function DELETE(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.followRequest.deleteMany({
        where: {
          requesterId: loggedInUser.id,
          recipientId: userId,
        },
      }),
      prisma.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: userId,
          type: "FOLLOW_REQUEST",
        },
      }),
    ]);

    return Response.json({ status: "CANCELED" });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
