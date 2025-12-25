"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";

import debug from "@/lib/debug";

// Use React's cache to avoid multiple database calls for the same data
export const getSiteSettings = cache(async () => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        googleLoginEnabled: true,
        manualSignupEnabled: true,
        logoUrl: true,
        logoHeight: true,
        logoWidth: true,
        faviconUrl: true,
      },
    });

    return settings || {
      googleLoginEnabled: true,
      manualSignupEnabled: true,
      logoUrl: null,
      logoHeight: 30,
      logoWidth: 150,
      faviconUrl: null,
    };
  } catch (error) {
    debug.error("Error fetching site settings:", error);
    // Default to enabling both methods if there's an error
    return {
      googleLoginEnabled: true,
      manualSignupEnabled: true,
      logoUrl: null,
      logoHeight: 30,
      logoWidth: 150,
      faviconUrl: null,
    };
  }
});

