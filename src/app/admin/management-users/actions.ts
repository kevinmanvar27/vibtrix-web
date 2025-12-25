"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { hash } from "@node-rs/argon2";
import { randomUUID } from "crypto";
import { z } from "zod";

const createUserSchema = z.object({
  displayName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER"]),
  isActive: z.boolean(),
});

export async function createManagementUser(data: z.infer<typeof createUserSchema>) {
  const { user } = await validateRequest();

  // Only SUPER_ADMIN can create management users
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Only Super Admins can create management users.");
  }

  const validatedData = createUserSchema.parse(data);

  // Check if username is already taken
  const existingUsername = await prisma.user.findFirst({
    where: {
      username: {
        equals: validatedData.username,
        mode: "insensitive",
      },
    },
  });

  if (existingUsername) {
    throw new Error("Username is already taken");
  }

  // Check if email is already taken
  if (validatedData.email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      throw new Error("Email is already taken");
    }
  }

  // Hash the password
  const passwordHash = await hash(validatedData.password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Create the user
  const newUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      displayName: validatedData.displayName,
      username: validatedData.username,
      email: validatedData.email,
      passwordHash,
      isAdmin: true, // For backward compatibility
      isManagementUser: true,
      role: validatedData.role,
      isActive: validatedData.isActive,
    },
  });

  // Add default permissions based on role
  const defaultPermissions = await getDefaultPermissionsForRole(validatedData.role);

  if (defaultPermissions.length > 0) {
    const permissionEntries = defaultPermissions.map(permissionId => ({
      id: randomUUID(),
      userId: newUser.id,
      permissionId,
    }));

    await prisma.userPermission.createMany({
      data: permissionEntries,
    });
  }

  return newUser;
}

// Helper function to get default permissions for a role
async function getDefaultPermissionsForRole(role: string) {
  // Create default permissions if they don't exist
  await ensureDefaultPermissionsExist();

  let permissionNames: string[] = [];

  switch (role) {
    case "ADMIN":
      permissionNames = [
        "view_users",
        "edit_users",
        "view_posts",
        "edit_posts",
        "delete_posts",
        "view_competitions",
        "edit_competitions",
        "view_pages",
        "edit_pages"
      ];
      break;
    case "MANAGER":
      permissionNames = [
        "view_users",
        "view_posts",
        "edit_posts",
        "delete_posts",
        "view_competitions",
        "edit_competitions",
        "create_competitions",
        "view_pages",
        "edit_pages",
        "create_pages"
      ];
      break;
    default:
      return [];
  }

  // Get permission IDs
  const permissions = await prisma.permission.findMany({
    where: {
      name: {
        in: permissionNames,
      },
    },
    select: {
      id: true,
    },
  });

  return permissions.map(p => p.id);
}

// Ensure default permissions exist in the database
async function ensureDefaultPermissionsExist() {
  const defaultPermissions = [
    { name: "view_users", description: "View user list and details" },
    { name: "edit_users", description: "Edit user information" },
    { name: "delete_users", description: "Delete users" },
    { name: "view_posts", description: "View posts" },
    { name: "edit_posts", description: "Edit posts" },
    { name: "delete_posts", description: "Delete posts" },
    { name: "view_competitions", description: "View competitions" },
    { name: "edit_competitions", description: "Edit competitions" },
    { name: "create_competitions", description: "Create new competitions" },
    { name: "delete_competitions", description: "Delete competitions" },
    { name: "view_pages", description: "View content pages" },
    { name: "edit_pages", description: "Edit content pages" },
    { name: "create_pages", description: "Create new content pages" },
    { name: "delete_pages", description: "Delete content pages" },
    { name: "manage_settings", description: "Manage site settings" },
    { name: "view_payments", description: "View payment information" },
    { name: "process_refunds", description: "Process payment refunds" },
  ];

  for (const permission of defaultPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: {
        id: randomUUID(),
        name: permission.name,
        description: permission.description,
      },
    });
  }
}

const updateUserSchema = z.object({
  displayName: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MANAGER"]),
  isActive: z.boolean(),
  permissions: z.array(z.string()),
});

export async function updateManagementUser(userId: string, data: z.infer<typeof updateUserSchema>) {
  const { user } = await validateRequest();

  // Only SUPER_ADMIN can update management users
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Only Super Admins can update management users.");
  }

  const validatedData = updateUserSchema.parse(data);

  // Check if username is already taken by another user
  const existingUsername = await prisma.user.findFirst({
    where: {
      username: {
        equals: validatedData.username,
        mode: "insensitive",
      },
      id: {
        not: userId,
      },
    },
  });

  if (existingUsername) {
    throw new Error("Username is already taken");
  }

  // Check if email is already taken by another user
  if (validatedData.email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: "insensitive",
        },
        id: {
          not: userId,
        },
      },
    });

    if (existingEmail) {
      throw new Error("Email is already taken");
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: validatedData.displayName,
      username: validatedData.username,
      email: validatedData.email,
      role: validatedData.role,
      isActive: validatedData.isActive,
    },
  });

  // Update permissions
  // First, delete all existing permissions
  await prisma.userPermission.deleteMany({
    where: { userId },
  });

  // Then add the new permissions
  if (validatedData.permissions.length > 0) {
    const permissionEntries = validatedData.permissions.map(permissionId => ({
      id: randomUUID(),
      userId,
      permissionId,
    }));

    await prisma.userPermission.createMany({
      data: permissionEntries,
    });
  }

  return updatedUser;
}

export async function deleteManagementUser(userId: string) {
  const { user } = await validateRequest();

  // Only SUPER_ADMIN can delete management users
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized. Only Super Admins can delete management users.");
  }

  // Check if user exists and is a management user
  const managementUser = await prisma.user.findFirst({
    where: {
      id: userId,
      isManagementUser: true,
    },
  });

  if (!managementUser) {
    throw new Error("Management user not found");
  }

  // Delete the user
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}

export async function getAllPermissions() {
  const { user } = await validateRequest();

  // Only SUPER_ADMIN can view all permissions
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  // Ensure default permissions exist
  await ensureDefaultPermissionsExist();

  return prisma.permission.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getUserPermissions(userId: string) {
  const { user } = await validateRequest();

  // Only SUPER_ADMIN can view user permissions
  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.userPermission.findMany({
    where: { userId },
    include: {
      permission: true,
    },
  });
}
