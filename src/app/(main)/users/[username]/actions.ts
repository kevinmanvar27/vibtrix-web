"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

import { getUserDataSelect } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";

export async function updateUserProfile(values: UpdateUserProfileValues) {
  const validatedValues = updateUserProfileSchema.parse(values);

  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  // Check if username is already taken (if it's different from current username)
  // Note: MySQL with default collation is case-insensitive by default
  if (validatedValues.username !== user.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: validatedValues.username,
        id: { not: user.id }, // Exclude current user
      },
    });

    if (existingUser) {
      throw new Error("Username already taken");
    }
  }

  // Handle socialLinks - ensure it's properly formatted for Prisma
  // Prisma expects JSON fields to be passed as complete objects, not nested updates
  const data: any = { ...validatedValues };
  
  // If socialLinks is provided, make sure it's a proper object
  if (data.socialLinks !== undefined) {
    // Ensure socialLinks is an object, not a string
    if (typeof data.socialLinks === 'string') {
      try {
        data.socialLinks = JSON.parse(data.socialLinks);
      } catch (e) {
        // If parsing fails, use empty object
        data.socialLinks = {};
      }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
    select: getUserDataSelect(user.id),
  });

  return updatedUser;
}
