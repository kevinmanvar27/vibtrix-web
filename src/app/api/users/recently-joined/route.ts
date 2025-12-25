import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    const isLoggedIn = !!user;

    // Get query parameters
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "6");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const onlineStatus = request.nextUrl.searchParams.get("onlineStatus");
    const gender = request.nextUrl.searchParams.get("gender");

    // For logged-in users, exclude the current user, blocked users, and users who have blocked them
    let excludedUserIds: string[] = [];

    if (isLoggedIn) {
      // Add the current user's ID to the excluded list
      excludedUserIds.push(user.id);

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

      // Combine all lists to exclude from search results
      excludedUserIds = [...excludedUserIds, ...blockedUserIds, ...blockedByUserIds];
    }

    // Build the where clause
    const whereClause: any = {
      isActive: true,
      // Only show users with role "USER"
      role: "USER",
    };

    // Add exclusions for blocked users
    if (excludedUserIds.length > 0) {
      whereClause.id = { notIn: excludedUserIds };
    }

    // Add filter for online status if provided and not 'all'
    if (onlineStatus && onlineStatus !== 'all') {
      whereClause.onlineStatus = onlineStatus;
    }

    // Add filter for gender if provided and not 'all'
    if (gender && gender !== 'all') {
      whereClause.gender = gender;
    }

    // Get recently joined users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: getUserDataSelect(isLoggedIn ? user?.id || '' : ''),
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return Response.json({
      users,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    debug.error("Error fetching recently joined users:", error);
    return Response.json(
      { error: "Failed to fetch recently joined users" },
      { status: 500 }
    );
  }
}
