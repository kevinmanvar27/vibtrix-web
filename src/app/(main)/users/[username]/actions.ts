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

  // Build update data, handling socialLinks correctly
  // socialLinks is stored as a JSON string (String? @db.LongText), not a Prisma Json type
  const { socialLinks, ...restValues } = validatedValues;
  const data: any = { ...restValues };

  if (socialLinks !== undefined) {
    if (typeof socialLinks === 'string') {
      // Already a string — store as-is (validate it's valid JSON first)
      try {
        JSON.parse(socialLinks);
        data.socialLinks = socialLinks;
      } catch (e) {
        data.socialLinks = '{}';
      }
    } else if (typeof socialLinks === 'object' && socialLinks !== null) {
      // Object — serialize to JSON string for storage
      data.socialLinks = JSON.stringify(socialLinks);
    } else {
      data.socialLinks = null;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data,
    select: getUserDataSelect(user.id),
  });

  return updatedUser;
}
