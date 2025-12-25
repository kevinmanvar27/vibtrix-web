import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

// GET /api/admin/roles/[roleId] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
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

    const { roleId } = params;

    // Fetch the role from the database
    const role = await prisma.role.findUnique({
      where: { id: roleId },
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
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Transform the data to a more usable format
    const formattedRole = {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map(rp => rp.permission),
      userCount: role._count.users,
    };

    return NextResponse.json(formattedRole);
  } catch (error) {
    debug.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[roleId] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const { user } = await validateRequest();

    // Only SUPER_ADMIN can update roles
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only Super Admins can update roles" },
        { status: 401 }
      );
    }

    const { roleId } = params;
    const data = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    // Check if the role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Prevent updating system roles
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: "System roles cannot be modified" },
        { status: 400 }
      );
    }

    // Check if another role with this name already exists
    const duplicateRole = await prisma.role.findFirst({
      where: {
        name: data.name,
        id: { not: roleId },
      },
    });

    if (duplicateRole) {
      return NextResponse.json(
        { error: "Another role with this name already exists" },
        { status: 400 }
      );
    }

    // Update the role in the database
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: data.name,
        description: data.description || "",
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    debug.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/roles/[roleId] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const { user } = await validateRequest();

    // Only SUPER_ADMIN can delete roles
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only Super Admins can delete roles" },
        { status: 401 }
      );
    }

    const { roleId } = params;

    // Check if the role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Prevent deleting system roles
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 400 }
      );
    }

    // Check if there are users with this role
    const usersWithRole = await prisma.user.count({
      where: { roleId: roleId },
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { error: "Cannot delete a role that is assigned to users" },
        { status: 400 }
      );
    }

    // Delete the role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: roleId },
    });

    // Delete the role
    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    debug.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
