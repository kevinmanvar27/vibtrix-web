"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

import { z } from "zod";

const userUpdateSchema = z.object({
  displayName: z.string().min(2),
  username: z.string().min(3),
  bio: z.string().optional(),
  isAdmin: z.boolean(),
  role: z.enum(["USER", "ADMIN", "MANAGER", "SUPER_ADMIN"]),
  isActive: z.boolean(),
});

export async function updateUser(userId: string, data: z.infer<typeof userUpdateSchema>) {
  const { user } = await validateRequest();

  // Check if user has appropriate role for admin access
  const hasAdminAccess = user && (
    user.role === "ADMIN" ||
    user.role === "MANAGER" ||
    user.role === "SUPER_ADMIN"
  );

  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  // Only SUPER_ADMIN and MANAGER can modify user roles
  const canModifyRoles = user && (
    user.role === "SUPER_ADMIN" ||
    user.role === "MANAGER"
  );

  // If user is trying to change role but doesn't have permission
  if (data.role && !canModifyRoles) {
    throw new Error("You don't have permission to modify user roles");
  }

  const validatedData = userUpdateSchema.parse(data);

  // Check if username is already taken by another user
  if (validatedData.username !== undefined) {
    const existingUser = await prisma.user.findFirst({
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

    if (existingUser) {
      throw new Error("Username is already taken");
    }
  }

  // Update user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: validatedData.displayName,
      username: validatedData.username,
      bio: validatedData.bio,
      isAdmin: validatedData.isAdmin,
      role: validatedData.role,
      isActive: validatedData.isActive,
    },
  });



  return updatedUser;
}
