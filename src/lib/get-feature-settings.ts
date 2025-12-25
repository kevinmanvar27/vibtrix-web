"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";

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

// Use React's cache to avoid multiple database calls for the same data
export const getFeatureSettings = cache(async (): Promise<FeatureSettings> => {
  try {
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

    return settings || {
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
  } catch (error) {
    debug.error("Error fetching feature settings:", error);
    // Default to enabling all features if there's an error
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
});
