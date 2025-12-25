import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// PATCH endpoint to accept or reject a follow request
export async function PATCH(
  req: NextRequest,
  { params: { requestId } }: { params: { requestId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    if (action !== "accept" && action !== "reject") {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find the follow request and ensure it belongs to the current user
    const followRequest = await prisma.followRequest.findUnique({
      where: {
        id: requestId,
        recipientId: loggedInUser.id, // Ensure the logged-in user is the recipient
        status: "PENDING", // Only pending requests can be accepted/rejected
      },
    });

    if (!followRequest) {
      return Response.json({ error: "Follow request not found" }, { status: 404 });
    }

    if (action === "accept") {
      // Check if a notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          issuerId: loggedInUser.id,
          recipientId: followRequest.requesterId,
          type: "FOLLOW_REQUEST_ACCEPTED",
        },
      });

      // Accept the follow request
      await prisma.$transaction([
        // Update the request status
        prisma.followRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        }),
        // Create the follow relationship
        prisma.follow.create({
          data: {
            followerId: followRequest.requesterId,
            followingId: loggedInUser.id,
          },
        }),
        // Create a notification for the requester only if it doesn't exist
        ...(!existingNotification ? [
          prisma.notification.create({
            data: {
              issuerId: loggedInUser.id,
              recipientId: followRequest.requesterId,
              type: "FOLLOW_REQUEST_ACCEPTED",
            },
          })
        ] : []),
      ]);

      return Response.json({ status: "ACCEPTED" });
    } else {
      // Reject the follow request
      await prisma.followRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      return Response.json({ status: "REJECTED" });
    }
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE endpoint to delete a follow request (for cleanup)
export async function DELETE(
  req: Request,
  { params: { requestId } }: { params: { requestId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the follow request and ensure it belongs to the current user
    const followRequest = await prisma.followRequest.findUnique({
      where: {
        id: requestId,
        recipientId: loggedInUser.id, // Ensure the logged-in user is the recipient
      },
    });

    if (!followRequest) {
      return Response.json({ error: "Follow request not found" }, { status: 404 });
    }

    // Delete the follow request
    await prisma.followRequest.delete({
      where: { id: requestId },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
