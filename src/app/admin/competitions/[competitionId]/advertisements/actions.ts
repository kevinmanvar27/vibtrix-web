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

// Create a new competition-specific advertisement
export async function createCompetitionAdvertisement(competitionId: string, formData: FormData) {
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

  // Check if competition exists
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) {
    throw new Error("Competition not found");
  }

  // Extract and validate form data
  const title = formData.get("title") as string;
  const adType = formData.get("adType") as MediaType;
  const mediaId = formData.get("mediaId") as string;
  const skipDuration = parseInt(formData.get("skipDuration") as string);
  const displayFrequency = parseInt(formData.get("displayFrequency") as string);
  const scheduleDate = new Date(formData.get("scheduleDate") as string);
  const expiryDate = new Date(formData.get("expiryDate") as string);
  const status = formData.get("status") as AdvertisementStatus;
  const url = formData.get("url") as string || undefined;

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
      competition: {
        connect: {
          id: competitionId
        }
      },
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/admin/competitions/${competitionId}/advertisements`);
  return advertisement;
}

// Update competition-specific advertisement
export async function updateCompetitionAdvertisement(id: string, competitionId: string, formData: FormData) {
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

  // Check if competition exists
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) {
    throw new Error("Competition not found");
  }

  // Extract and validate form data
  const title = formData.get("title") as string;
  const adType = formData.get("adType") as MediaType;
  const mediaId = formData.get("mediaId") as string;
  const skipDuration = parseInt(formData.get("skipDuration") as string);
  const displayFrequency = parseInt(formData.get("displayFrequency") as string);
  const scheduleDate = new Date(formData.get("scheduleDate") as string);
  const expiryDate = new Date(formData.get("expiryDate") as string);
  const status = formData.get("status") as AdvertisementStatus;
  const url = formData.get("url") as string || undefined;

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
      competition: {
        connect: {
          id: competitionId
        }
      },
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/admin/competitions/${competitionId}/advertisements`);
  return advertisement;
}
