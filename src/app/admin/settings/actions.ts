"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { storeFile } from "@/lib/fileStorage";
import { z } from "zod";

import debug from "@/lib/debug";

const settingsSchema = z.object({
  logoUrl: z.string().optional().nullable(),
  logoHeight: z.number().int().min(1, "Must be at least 1 pixel").optional().nullable(),
  logoWidth: z.number().int().min(1, "Must be at least 1 pixel").optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  googleLoginEnabled: z.boolean(),
  manualSignupEnabled: z.boolean(),

  timezone: z.string().min(1, "Timezone is required"),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export async function updateSettings(data: SettingsFormValues) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return { success: false, error: "Unauthorized: You must be an admin to update settings" };
    }

    const validatedData = settingsSchema.parse(data);

    try {
      // Use the normal Prisma update
      const settings = await prisma.siteSettings.upsert({
        where: { id: "settings" },
        update: {

          logoUrl: validatedData.logoUrl,
          logoHeight: validatedData.logoHeight,
          logoWidth: validatedData.logoWidth,
          faviconUrl: validatedData.faviconUrl,
          googleLoginEnabled: validatedData.googleLoginEnabled,
          manualSignupEnabled: validatedData.manualSignupEnabled,

          timezone: validatedData.timezone,
        },
        create: {
          id: "settings",

          logoUrl: validatedData.logoUrl,
          logoHeight: validatedData.logoHeight,
          logoWidth: validatedData.logoWidth,
          faviconUrl: validatedData.faviconUrl,
          googleLoginEnabled: validatedData.googleLoginEnabled,
          manualSignupEnabled: validatedData.manualSignupEnabled,

          timezone: validatedData.timezone,
        },
      });


      // Get the updated settings to return
      const updatedSettings = await prisma.siteSettings.findUnique({
        where: { id: "settings" },
      });

      return { success: true, settings: updatedSettings };
    } catch (error) {
      debug.error("Error updating settings:", error);
      throw error;
    }
  } catch (error) {
    debug.error("Error updating settings:", error);
    return { success: false, error: "Failed to update settings: " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function uploadLogo(formData: FormData) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return { success: false, error: "Unauthorized: You must be an admin to upload a logo" };
    }

    const file = formData.get('file') as File;
    if (!file) {
      throw new Error("No file provided");
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error("Only image files are allowed");
    }



    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Store the file
    const fileUrl = await storeFile(buffer, file.name);

    // Update settings with new logo URL
    const settings = await prisma.siteSettings.upsert({
      where: { id: "settings" },
      update: {
        logoUrl: fileUrl,
      },
      create: {
        id: "settings",

        logoUrl: fileUrl,
        logoHeight: 30,
        logoWidth: 150,
        faviconUrl: null,
        googleLoginEnabled: true,
        manualSignupEnabled: true,

        timezone: "Asia/Kolkata",
      },
    });



    return { success: true, fileUrl };
  } catch (error) {
    debug.error("Error uploading logo:", error);
    return { success: false, error: "Failed to upload logo: " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function removeLogo() {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return { success: false, error: "Unauthorized: You must be an admin to remove the logo" };
    }

    // Update settings to set logoUrl to null
    const settings = await prisma.siteSettings.update({
      where: { id: "settings" },
      data: {
        logoUrl: null,
      },
    });

    return { success: true };
  } catch (error) {
    debug.error("Error removing logo:", error);
    return { success: false, error: "Failed to remove logo: " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function uploadFavicon(formData: FormData) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return { success: false, error: "Unauthorized: You must be an admin to upload a favicon" };
    }

    const file = formData.get('file') as File;
    if (!file) {
      throw new Error("No file provided");
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error("Only image files are allowed");
    }



    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Store the file
    const fileUrl = await storeFile(buffer, file.name);

    // Update settings with new favicon URL
    const settings = await prisma.siteSettings.upsert({
      where: { id: "settings" },
      update: {
        faviconUrl: fileUrl,
      },
      create: {
        id: "settings",

        logoUrl: null,
        logoHeight: 30,
        logoWidth: 150,
        faviconUrl: fileUrl,
        googleLoginEnabled: true,
        manualSignupEnabled: true,

        timezone: "Asia/Kolkata",
      },
    });



    return { success: true, fileUrl };
  } catch (error) {
    debug.error("Error uploading favicon:", error);
    return { success: false, error: "Failed to upload favicon: " + (error instanceof Error ? error.message : String(error)) };
  }
}

export async function removeFavicon() {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return { success: false, error: "Unauthorized: You must be an admin to remove the favicon" };
    }

    // Update settings to set faviconUrl to null
    const settings = await prisma.siteSettings.update({
      where: { id: "settings" },
      data: {
        faviconUrl: null,
      },
    });

    return { success: true };
  } catch (error) {
    debug.error("Error removing favicon:", error);
    return { success: false, error: "Failed to remove favicon: " + (error instanceof Error ? error.message : String(error)) };
  }
}