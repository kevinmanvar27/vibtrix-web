import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

// GET /api/admin/permissions - Get all permissions
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

    // Fetch permissions from the database
    const permissions = await prisma.permission.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(permissions);
  } catch (error) {
    debug.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions - Create a new permission
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    // Only SUPER_ADMIN can create permissions
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only Super Admins can create permissions" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Permission name is required" },
        { status: 400 }
      );
    }

    // Create the permission in the database
    const newPermission = await prisma.permission.create({
      data: {
        name: data.name,
        description: data.description || "",
      },
    });

    // Return the new permission with a message to use the roles interface
    return NextResponse.json({
      ...newPermission,
      message: "Permission created. Please use the Roles interface to manage permissions."
    }, { status: 201 });
  } catch (error) {
    debug.error("Error creating permission:", error);
    return NextResponse.json(
      { error: "Failed to create permission" },
      { status: 500 }
    );
  }
}
