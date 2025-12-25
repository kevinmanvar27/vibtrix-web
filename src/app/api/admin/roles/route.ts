import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

// GET /api/admin/roles - Get all roles
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
    
    // Build the where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch roles from the database
    const roles = await prisma.role.findMany({
      where,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform the data to a more usable format
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map(rp => rp.permission),
      userCount: role._count.users,
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    debug.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    // Only SUPER_ADMIN can create roles
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only Super Admins can create roles" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Check if role with this name already exists
    const existingRole = await prisma.role.findFirst({
      where: { name: data.name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 400 }
      );
    }

    // Create the role in the database
    const newRole = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || "",
        isSystem: false, // Custom roles are never system roles
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    debug.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
