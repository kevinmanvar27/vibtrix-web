"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";

import debug from "@/lib/debug";

// Define the type for feature settings
export type FeatureSettings = {
  likesEnabled: boolean;
  commentsEnabled: boolean;
  sharingEnabled: boolean;
  messagingEnabled: boolean;
  userBlockingEnabled: boolean;
  loginActivityTrackingEnabled: boolean;
  viewsEnabled: boolean;
  bookmarksEnabled: boolean;
  advertisementsEnabled: boolean;
  showStickeredAdvertisements: boolean;

  // Modeling feature settings
  modelingFeatureEnabled?: boolean;
  modelingMinFollowers?: number;
  modelingPhotoshootLabel?: string;
  modelingVideoAdsLabel?: string;

  // Brand Ambassadorship feature settings
  brandAmbassadorshipEnabled?: boolean;
  brandAmbassadorshipMinFollowers?: number;
  brandAmbassadorshipPricingLabel?: string;
  brandAmbassadorshipPreferencesLabel?: string;
};

// Default settings function
function getDefaultSettings(): FeatureSettings {
  return {
    likesEnabled: true,
    commentsEnabled: true,
    sharingEnabled: true,
    messagingEnabled: true,
    userBlockingEnabled: true,
    loginActivityTrackingEnabled: true,
    viewsEnabled: true,
    bookmarksEnabled: true,
    advertisementsEnabled: true,
    showStickeredAdvertisements: true,

    // Modeling feature settings
    modelingFeatureEnabled: false,
    modelingMinFollowers: 1000,
    modelingPhotoshootLabel: "Photoshoot Price Per Day",
    modelingVideoAdsLabel: "Video Ads Note",

    // Brand Ambassadorship feature settings
    brandAmbassadorshipEnabled: false,
    brandAmbassadorshipMinFollowers: 5000,
    brandAmbassadorshipPricingLabel: "Pricing Information",
    brandAmbassadorshipPreferencesLabel: "Brand Preferences",
  };
}

// AGGRESSIVE: Use both React cache AND Next.js unstable_cache for ultra-fast navigation
// This caches feature settings for 5 minutes, reducing database calls to near-zero
const getCachedFeatureSettings = unstable_cache(
  async (): Promise<FeatureSettings> => {
    try {
      // Check if prisma client is initialized
      if (!prisma || typeof prisma.siteSettings === 'undefined') {
        debug.warn("Prisma client not properly initialized, using default settings");
        return getDefaultSettings();
      }

      const settings = await prisma.siteSettings.findUnique({
        where: { id: "settings" },
        select: {
          likesEnabled: true,
          commentsEnabled: true,
          sharingEnabled: true,
          messagingEnabled: true,
          userBlockingEnabled: true,
          loginActivityTrackingEnabled: true,
          viewsEnabled: true,
          bookmarksEnabled: true,
          advertisementsEnabled: true,
          showStickeredAdvertisements: true,

          // Modeling feature settings
          modelingFeatureEnabled: true,
          modelingMinFollowers: true,
          modelingPhotoshootLabel: true,
          modelingVideoAdsLabel: true,

          // Brand Ambassadorship feature settings
          brandAmbassadorshipEnabled: true,
          brandAmbassadorshipMinFollowers: true,
          brandAmbassadorshipPricingLabel: true,
          brandAmbassadorshipPreferencesLabel: true,
        },
      });

      if (settings) {
        // Convert null values to undefined for optional string fields
        return {
          ...settings,
          modelingPhotoshootLabel: settings.modelingPhotoshootLabel ?? undefined,
          modelingVideoAdsLabel: settings.modelingVideoAdsLabel ?? undefined,
          brandAmbassadorshipPricingLabel: settings.brandAmbassadorshipPricingLabel ?? undefined,
          brandAmbassadorshipPreferencesLabel: settings.brandAmbassadorshipPreferencesLabel ?? undefined,
        };
      }

      return getDefaultSettings();
    } catch (error) {
      debug.error("Error fetching feature settings:", error);
      // Default to enabling all features if there's an error
      return getDefaultSettings();
    }
  },
  ['feature-settings'], // Cache key
  {
    revalidate: 300, // 5 minutes cache - ultra-aggressive for instant navigation
    tags: ['feature-settings'],
  }
);

// Use React's cache to avoid multiple calls within the same request
export const getFeatureSettings = cache(async (): Promise<FeatureSettings> => {
  return getCachedFeatureSettings();
});
