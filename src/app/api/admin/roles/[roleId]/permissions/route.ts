import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

// GET /api/admin/roles/[roleId]/permissions - Get permissions for a role
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

    // Check if the role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: "asc" },
    });

    // Get permissions assigned to this role
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    const assignedPermissionIds = rolePermissions.map(rp => rp.permissionId);

    return NextResponse.json({
      permissions: allPermissions,
      assignedPermissionIds,
    });
  } catch (error) {
    debug.error("Error fetching role permissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch role permissions" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/roles/[roleId]/permissions - Update permissions for a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const { user } = await validateRequest();

    // Only SUPER_ADMIN can update role permissions
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only Super Admins can update role permissions" },
        { status: 401 }
      );
    }

    const { roleId } = params;
    const data = await request.json();

    // Validate the request body
    if (!data.permissionIds || !Array.isArray(data.permissionIds)) {
      return NextResponse.json(
        { error: "Permission IDs array is required" },
        { status: 400 }
      );
    }

    // Check if the role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // For system roles, we might want to prevent certain modifications
    // This is a simplified example - you might want to add more complex logic
    if (role.isSystem) {
      // For system roles, we might want to prevent removing certain core permissions
      // This is just a placeholder for that logic
      debug.log("Updating system role permissions - additional validation might be needed");
    }

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new role permissions
    if (data.permissionIds.length > 0) {
      // Verify all permissions exist
      const existingPermissions = await prisma.permission.findMany({
        where: { id: { in: data.permissionIds } },
        select: { id: true },
      });

      const existingPermissionIds = existingPermissions.map(p => p.id);
      
      // Filter out any non-existent permission IDs
      const validPermissionIds = data.permissionIds.filter(
        (id: string) => existingPermissionIds.includes(id)
      );

      // Create the new role permissions
      await prisma.$transaction(
        validPermissionIds.map((permissionId: string) =>
          prisma.rolePermission.create({
            data: {
              roleId,
              permissionId,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    debug.error("Error updating role permissions:", error);
    return NextResponse.json(
      { error: "Failed to update role permissions" },
      { status: 500 }
    );
  }
}
