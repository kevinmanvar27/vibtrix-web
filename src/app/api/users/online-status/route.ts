import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { OnlineStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET endpoint to retrieve the online status of a user
export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    const isLoggedIn = !!user;

    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onlineStatus: true,
        lastActiveAt: true,
        showOnlineStatus: true,
      },
    });

    if (!userData) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // If the user has chosen to hide their online status, return OFFLINE
    if (!userData.showOnlineStatus) {
      return Response.json({
        onlineStatus: "OFFLINE",
        lastActiveAt: null,
      });
    }

    return Response.json({
      onlineStatus: userData.onlineStatus,
      lastActiveAt: userData.lastActiveAt,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to update the online status of the current user
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if request has content before trying to parse JSON
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      debug.error('Invalid content type for online status update:', contentType);
      return Response.json({ error: "Invalid content type, expected application/json" }, { status: 400 });
    }

    let requestBody;
    try {
      // Clone the request to avoid consuming it
      const clonedRequest = request.clone();
      const text = await clonedRequest.text();

      // Log the raw request body for debugging
      debug.log('Online status update raw request body:', text);

      // Check if the body is empty
      if (!text || text.trim() === '') {
        debug.error('Empty request body for online status update');
        return Response.json({ error: "Empty request body" }, { status: 400 });
      }

      // Parse the JSON
      requestBody = JSON.parse(text);
    } catch (parseError) {
      debug.error('Error parsing JSON for online status update:', parseError);
      return Response.json({
        error: "Invalid JSON in request body",
        details: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      }, { status: 400 });
    }

    const { status } = requestBody;

    // Validate the status
    if (!status || !Object.values(OnlineStatus).includes(status as OnlineStatus)) {
      debug.error('Invalid online status value:', status);
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update the user's online status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onlineStatus: status as OnlineStatus,
        lastActiveAt: new Date(),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    debug.error('Error in online status update:', error);
    return Response.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
