import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

// Default permissions to seed
const defaultPermissions = [
  // Users module
  { name: "users_view", description: "View users" },
  { name: "users_create", description: "Create users" },
  { name: "users_edit", description: "Edit users" },
  { name: "users_delete", description: "Delete users" },
  
  // Posts module
  { name: "posts_view", description: "View posts" },
  { name: "posts_create", description: "Create posts" },
  { name: "posts_edit", description: "Edit posts" },
  { name: "posts_delete", description: "Delete posts" },
  
  // Competitions module
  { name: "competitions_view", description: "View competitions" },
  { name: "competitions_create", description: "Create competitions" },
  { name: "competitions_edit", description: "Edit competitions" },
  { name: "competitions_delete", description: "Delete competitions" },
  
  // Pages module
  { name: "pages_view", description: "View pages" },
  { name: "pages_create", description: "Create pages" },
  { name: "pages_edit", description: "Edit pages" },
  { name: "pages_delete", description: "Delete pages" },
  
  // Settings module
  { name: "settings_view", description: "View settings" },
  { name: "settings_edit", description: "Edit settings" },
  
  // Roles module
  { name: "roles_view", description: "View roles" },
  { name: "roles_create", description: "Create roles" },
  { name: "roles_edit", description: "Edit roles" },
  { name: "roles_delete", description: "Delete roles" },
  
  // Permissions module
  { name: "permissions_view", description: "View permissions" },
  { name: "permissions_create", description: "Create permissions" },
  
  // Stickers module
  { name: "stickers_view", description: "View stickers" },
  { name: "stickers_create", description: "Create stickers" },
  { name: "stickers_edit", description: "Edit stickers" },
  { name: "stickers_delete", description: "Delete stickers" },
  
  // Payments module
  { name: "payments_view", description: "View payments" },
  { name: "payments_create", description: "Create payments" },
  { name: "payments_edit", description: "Edit payments" },
  { name: "payments_delete", description: "Delete payments" },
];

// POST /api/admin/permissions/seed - Seed default permissions
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    // Only SUPER_ADMIN can seed permissions
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Only Super Admins can seed permissions" },
        { status: 401 }
      );
    }

    // Check if permissions already exist
    const existingPermissionsCount = await prisma.permission.count();
    
    if (existingPermissionsCount > 0) {
      return NextResponse.json({
        message: "Permissions already exist. No seeding necessary.",
        count: existingPermissionsCount
      });
    }

    // Create all default permissions
    const createdPermissions = await prisma.$transaction(
      defaultPermissions.map(permission => 
        prisma.permission.create({
          data: {
            name: permission.name,
            description: permission.description,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Default permissions seeded successfully",
      count: createdPermissions.length,
      permissions: createdPermissions
    }, { status: 201 });
  } catch (error) {
    debug.error("Error seeding permissions:", error);
    return NextResponse.json(
      { error: "Failed to seed permissions" },
      { status: 500 }
    );
  }
}
