"use client";

import { FeatureSettings } from "@/lib/get-feature-settings";
import { createContext, useContext } from "react";

// Create a context for feature settings
export const FeatureSettingsContext = createContext<FeatureSettings>({
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
});

// Hook to use feature settings
export function useFeatureSettings() {
  return useContext(FeatureSettingsContext);
}
