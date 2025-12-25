"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { AdvertisementStatus, MediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import debug from "@/lib/debug";

// Schema for creating a new advertisement
const createAdvertisementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  adType: z.enum(["IMAGE", "VIDEO"]),
  mediaId: z.string().min(1, "Media is required"),
  skipDuration: z.number().min(1, "Skip duration must be at least 1 second"),
  displayFrequency: z.number().min(1, "Display frequency must be at least 1"),
  scheduleDate: z.date(),
  expiryDate: z.date(),
  status: z.enum(["ACTIVE", "PAUSED", "SCHEDULED", "EXPIRED"]),
  url: z.string().url("Please enter a valid URL").optional(),
});

// Create a new advertisement
export async function createAdvertisement(formData: FormData) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Check if advertisements feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { advertisementsEnabled: true },
  });

  if (!settings?.advertisementsEnabled) {
    throw new Error("Advertisements feature is currently disabled");
  }

  // Parse form data
  const title = formData.get("title") as string;
  const adType = formData.get("adType") as MediaType;
  const mediaId = formData.get("mediaId") as string;
  const skipDuration = parseInt(formData.get("skipDuration") as string);
  const displayFrequency = parseInt(formData.get("displayFrequency") as string);
  const scheduleDate = new Date(formData.get("scheduleDate") as string);
  const expiryDate = new Date(formData.get("expiryDate") as string);
  const status = formData.get("status") as AdvertisementStatus;
  const url = formData.get("url") as string || null;

  // Validate data
  const validationResult = createAdvertisementSchema.safeParse({
    title,
    adType,
    mediaId,
    skipDuration,
    displayFrequency,
    scheduleDate,
    expiryDate,
    status,
    url,
  });

  if (!validationResult.success) {
    throw new Error(
      `Invalid data: ${JSON.stringify(validationResult.error.format())}`
    );
  }

  // Create advertisement
  const advertisement = await prisma.advertisement.create({
    data: {
      title,
      adType,
      media: {
        connect: {
          id: mediaId
        }
      },
      skipDuration,
      displayFrequency,
      scheduleDate,
      expiryDate,
      status,
      url,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/advertisements");
  return advertisement;
}

// Toggle advertisement status (alias for updateAdvertisementStatus)
export async function toggleAdvertisementStatus(
  id: string,
  status: AdvertisementStatus
) {
  return updateAdvertisementStatus(id, status);
}

// Update advertisement status
export async function updateAdvertisementStatus(
  id: string,
  status: AdvertisementStatus
) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Check if advertisements feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { advertisementsEnabled: true },
  });

  if (!settings?.advertisementsEnabled) {
    throw new Error("Advertisements feature is currently disabled");
  }

  // Check if advertisement exists
  const existingAdvertisement = await prisma.advertisement.findUnique({
    where: { id },
  });

  if (!existingAdvertisement) {
    throw new Error("Advertisement not found");
  }

  // Update advertisement status
  const advertisement = await prisma.advertisement.update({
    where: { id },
    data: {
      status,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/advertisements");
  return advertisement;
}

// Update advertisement
export async function updateAdvertisement(id: string, formData: FormData) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Check if advertisements feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { advertisementsEnabled: true },
  });

  if (!settings?.advertisementsEnabled) {
    throw new Error("Advertisements feature is currently disabled");
  }

  // Check if advertisement exists
  const existingAdvertisement = await prisma.advertisement.findUnique({
    where: { id },
  });

  if (!existingAdvertisement) {
    throw new Error("Advertisement not found");
  }

  // Parse form data
  const title = formData.get("title") as string;
  const adType = formData.get("adType") as MediaType;
  const mediaId = formData.get("mediaId") as string;
  const skipDuration = parseInt(formData.get("skipDuration") as string);
  const displayFrequency = parseInt(formData.get("displayFrequency") as string);
  const scheduleDate = new Date(formData.get("scheduleDate") as string);
  const expiryDate = new Date(formData.get("expiryDate") as string);
  const status = formData.get("status") as AdvertisementStatus;
  const url = formData.get("url") as string || null;

  // Validate data
  const validationResult = createAdvertisementSchema.safeParse({
    title,
    adType,
    mediaId,
    skipDuration,
    displayFrequency,
    scheduleDate,
    expiryDate,
    status,
    url,
  });

  if (!validationResult.success) {
    throw new Error(
      `Invalid data: ${JSON.stringify(validationResult.error.format())}`
    );
  }

  // Update advertisement
  const advertisement = await prisma.advertisement.update({
    where: { id },
    data: {
      title,
      adType,
      media: {
        connect: {
          id: mediaId
        }
      },
      skipDuration,
      displayFrequency,
      scheduleDate,
      expiryDate,
      status,
      url,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/advertisements");
  return advertisement;
}

// Delete advertisement
export async function deleteAdvertisement(id: string) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Check if advertisement exists
  const existingAdvertisement = await prisma.advertisement.findUnique({
    where: { id },
  });

  if (!existingAdvertisement) {
    throw new Error("Advertisement not found");
  }

  // Delete advertisement
  await prisma.advertisement.delete({
    where: { id },
  });

  revalidatePath("/admin/advertisements");
  return { success: true };
}

// Toggle feed media display setting
export async function toggleFeedMediaDisplay(showStickeredMedia: boolean) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Check if advertisements feature is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { advertisementsEnabled: true },
  });

  if (!settings?.advertisementsEnabled) {
    throw new Error("Advertisements feature is currently disabled");
  }

  // Update site settings
  await prisma.siteSettings.update({
    where: { id: "settings" },
    data: {
      showStickeredAdvertisements: showStickeredMedia,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/advertisements/feed-settings");
  return { success: true };
}

// Toggle feed stickers display setting
export async function toggleFeedStickersDisplay(showFeedStickers: boolean) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  try {
    debug.log(`Server Action: toggleFeedStickersDisplay - Setting value to: ${showFeedStickers}`);

    // First, make sure the column exists
    await prisma.$executeRaw`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showFeedStickers" BOOLEAN NOT NULL DEFAULT true;`;

    // Update site settings using Prisma for better type safety
    const updatedSettings = await prisma.siteSettings.update({
      where: { id: "settings" },
      data: {
        showFeedStickers: showFeedStickers,
        updatedAt: new Date()
      },
    });

    debug.log(`Server Action: toggleFeedStickersDisplay - Update successful:`, {
      requestedValue: showFeedStickers,
      actualValue: updatedSettings.showFeedStickers,
      success: updatedSettings.showFeedStickers === showFeedStickers
    });

    // Revalidate all paths that might use this setting
    revalidatePath("/admin/advertisements/feed-settings");
    revalidatePath("/");
    revalidatePath("/following");

    return {
      success: true,
      updatedValue: updatedSettings.showFeedStickers,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    debug.error("Error updating feed stickers setting:", error);

    // If the settings record doesn't exist yet, create it
    try {
      debug.log("Settings record not found, creating it...");
      const newSettings = await prisma.siteSettings.create({
        data: {
          id: "settings",
          showFeedStickers: showFeedStickers,
        },
      });

      debug.log("Created settings record:", newSettings);

      // Revalidate all paths that might use this setting
      revalidatePath("/admin/advertisements/feed-settings");
      revalidatePath("/");
      revalidatePath("/following");

      return {
        success: true,
        updatedValue: newSettings.showFeedStickers,
        timestamp: new Date().toISOString()
      };
    } catch (createError) {
      debug.error("Error creating settings record:", createError);
      throw new Error("Failed to update feed stickers setting. Please try again.");
    }
  }
}
