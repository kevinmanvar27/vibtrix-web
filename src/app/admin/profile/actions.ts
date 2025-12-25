"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";
import debug from "@/lib/debug";

// Import removed to avoid serialization issues
// import streamServerClient from "@/lib/stream";

const profileSchema = z.object({
  username: z.string().min(3),
  displayName: z.string().min(2),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});

/**
 * Updates an admin user profile in the database
 * This function is specifically designed to avoid serialization issues
 * by not using the Stream client in the admin profile context
 */
export async function updateAdminProfile(
  userId: string,
  data: z.infer<typeof profileSchema>
) {
  try {
    // Validate the request
    const { user } = await validateRequest();

    if (!user || !user.isAdmin || user.id !== userId) {
      return { error: "Unauthorized" };
    }

    // Parse and validate the input data
    const validatedData = profileSchema.parse(data);

    // Check if username is already taken by another user
    if (validatedData.username !== user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: validatedData.username,
            mode: "insensitive",
          },
          id: { not: userId },
        },
      });

      if (existingUser) {
        return { error: "Username is already taken" };
      }
    }

    // Check if email is already taken by another user
    if (validatedData.email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: validatedData.email,
            mode: "insensitive",
          },
          id: { not: userId },
        },
      });

      if (existingUser) {
        return { error: "Email is already taken" };
      }
    }

    // Prepare update data with only the necessary fields
    const updateData: Record<string, any> = {
      username: validatedData.username,
      displayName: validatedData.displayName,
      email: validatedData.email,
    };

    // Handle password change if requested
    if (validatedData.currentPassword && validatedData.newPassword) {
      // Get current user with password hash
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!currentUser?.passwordHash) {
        return { error: "Cannot verify current password" };
      }

      // Verify current password
      const validPassword = await verify(
        currentUser.passwordHash,
        validatedData.currentPassword,
        {
          memoryCost: 19456,
          timeCost: 2,
          outputLen: 32,
          parallelism: 1,
        }
      );

      if (!validPassword) {
        return { error: "Current password is incorrect" };
      }

      // Hash new password
      updateData.passwordHash = await hash(validatedData.newPassword, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
    }

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Note: We intentionally skip Stream Chat update for admin profile to avoid serialization issues
    // The Stream Chat user data will be updated when they log in next time

    return { success: true };
  } catch (error) {
    debug.error('Error updating admin profile:', error);
    return { error: 'Failed to update profile. Please try again.' };
  }
}
