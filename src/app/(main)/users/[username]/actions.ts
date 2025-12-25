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
  if (validatedValues.username !== user.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: validatedValues.username,
          mode: "insensitive",
        },
        id: { not: user.id }, // Exclude current user
      },
    });

    if (existingUser) {
      throw new Error("Username already taken");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: validatedValues,
    select: getUserDataSelect(user.id),
  });

  return updatedUser;
}
