import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    // Check if user has appropriate role for admin access
    const hasAdminAccess = user && (
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "SUPER_ADMIN"
    );

    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (role) {
      where.role = role;
    }

    // Fetch users from the database
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        isManagementUser: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Count total users for pagination
    const total = await prisma.user.count({ where });

    return NextResponse.json(users);
  } catch (error) {
    debug.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
