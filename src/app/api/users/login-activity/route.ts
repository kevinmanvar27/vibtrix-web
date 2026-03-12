import { validateRequest } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

// Create a new instance of PrismaClient
const prisma = new PrismaClient();

/**
 * GET endpoint to retrieve login activity for the current user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    // Get login activity for the current user
    const loginActivities = await prisma.userLoginActivity.findMany({
      where: { userId: user.id },
      orderBy: { loginAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.userLoginActivity.count({
      where: { userId: user.id },
    });

    return Response.json({
      data: loginActivities,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    debug.error("Error retrieving login activity:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Admin endpoint to retrieve login activity for any user
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(request);

    // Check if user is authenticated and has admin privileges
    if (!user || !["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(user.role || "")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, limit = 10, page = 1 } = body;
    const offset = (page - 1) * limit;

    // If userId is provided, get login activity for that user
    // Otherwise, get login activity for all users
    const whereClause = userId ? { userId } : {};

    // Get login activity
    const loginActivities = await prisma.userLoginActivity.findMany({
      where: whereClause,
      orderBy: { loginAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.userLoginActivity.count({
      where: whereClause,
    });

    return Response.json({
      data: loginActivities,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    debug.error("Error retrieving login activity:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
