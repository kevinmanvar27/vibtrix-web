import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Update Firebase settings
    if ('firebaseEnabled' in data) {
      await prisma.siteSettings.update({
        where: { id: "settings" },
        data: {
          firebase_enabled: data.firebaseEnabled,
          firebase_api_key: data.firebaseApiKey,
          firebase_auth_domain: data.firebaseAuthDomain,
          firebase_project_id: data.firebaseProjectId,
          firebase_storage_bucket: data.firebaseStorageBucket,
          firebase_messaging_sender_id: data.firebaseMessagingSenderId,
          firebase_app_id: data.firebaseAppId,
          firebase_measurement_id: data.firebaseMeasurementId,
          push_notifications_enabled: data.pushNotificationsEnabled,
          updatedAt: new Date(),
        },
      });

      return Response.json({
        success: true,
        message: "Firebase settings updated successfully",
      });
    }

    return Response.json(
      { error: "Invalid settings data" },
      { status: 400 }
    );
  } catch (error) {
    debug.error("Error updating settings:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// Add PUT method to handle Google Analytics settings
export async function PUT(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { section, settings } = await req.json();

    if (!section || !settings) {
      return Response.json(
        { error: "Missing section or settings" },
        { status: 400 }
      );
    }

    // Update settings based on section
    switch (section) {
      case "analytics":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            googleAnalyticsEnabled: settings.googleAnalyticsEnabled,
            googleAnalyticsId: settings.googleAnalyticsId,
            updatedAt: new Date(),
          },
        });
        break;
      case "firebase":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            firebase_enabled: settings.firebaseEnabled,
            firebase_api_key: settings.firebaseApiKey,
            firebase_auth_domain: settings.firebaseAuthDomain,
            firebase_project_id: settings.firebaseProjectId,
            firebase_storage_bucket: settings.firebaseStorageBucket,
            firebase_messaging_sender_id: settings.firebaseMessagingSenderId,
            firebase_app_id: settings.firebaseAppId,
            firebase_measurement_id: settings.firebaseMeasurementId,
            push_notifications_enabled: settings.pushNotificationsEnabled,
            updatedAt: new Date(),
          },
        });
        break;
      default:
        return Response.json(
          { error: "Invalid settings section" },
          { status: 400 }
        );
    }

    return Response.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    debug.error("Error updating settings:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    debug.log("User making settings update request:", user?.id, user?.isAdmin);

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    debug.log("Request body:", body);

    const { section, settings } = body;

    if (!section || !settings) {
      debug.error("Missing section or settings:", { section, settings });
      return Response.json(
        { error: "Missing section or settings" },
        { status: 400 }
      );
    }

    // Update settings based on section
    switch (section) {
      case "media":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            maxImageSize: settings.maxImageSize,
            minVideoDuration: settings.minVideoDuration,
            maxVideoDuration: settings.maxVideoDuration,
            updatedAt: new Date(),
          },
        });
        break;
      case "appearance":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            logoUrl: settings.logoUrl,
            logoHeight: settings.logoHeight,
            logoWidth: settings.logoWidth,
            faviconUrl: settings.faviconUrl,
            updatedAt: new Date(),
          },
        });
        break;
      case "auth":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            googleLoginEnabled: settings.googleLoginEnabled,
            manualSignupEnabled: settings.manualSignupEnabled,
            updatedAt: new Date(),
          },
        });
        break;
      case "general":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            timezone: settings.timezone,
            updatedAt: new Date(),
          },
        });
        break;
      case "payment":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            razorpayEnabled: settings.razorpayEnabled,
            updatedAt: new Date(),
          },
        });
        break;
      case "firebase":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            firebase_enabled: settings.firebaseEnabled,
            firebase_api_key: settings.firebaseApiKey,
            firebase_auth_domain: settings.firebaseAuthDomain,
            firebase_project_id: settings.firebaseProjectId,
            firebase_storage_bucket: settings.firebaseStorageBucket,
            firebase_messaging_sender_id: settings.firebaseMessagingSenderId,
            firebase_app_id: settings.firebaseAppId,
            firebase_measurement_id: settings.firebaseMeasurementId,
            push_notifications_enabled: settings.pushNotificationsEnabled,
            updatedAt: new Date(),
          },
        });
        break;
      case "analytics":
        await prisma.siteSettings.update({
          where: { id: "settings" },
          data: {
            googleAnalyticsEnabled: settings.googleAnalyticsEnabled,
            googleAnalyticsId: settings.googleAnalyticsId,
            updatedAt: new Date(),
          },
        });
        break;
      case "features":
        // Log the incoming settings
        debug.log("Received feature settings update:", settings);

        try {
          const updatedSettings = await prisma.siteSettings.upsert({
            where: { id: "settings" },
            update: {
              likesEnabled: settings.likesEnabled,
              commentsEnabled: settings.commentsEnabled,
              sharingEnabled: settings.sharingEnabled,
              messagingEnabled: settings.messagingEnabled,
              userBlockingEnabled: settings.userBlockingEnabled,
              loginActivityTrackingEnabled: settings.loginActivityTrackingEnabled,
              viewsEnabled: settings.viewsEnabled,
              bookmarksEnabled: settings.bookmarksEnabled,
              advertisementsEnabled: settings.advertisementsEnabled,
              showStickeredAdvertisements: settings.showStickeredAdvertisements,

              // Modeling feature settings
              modelingFeatureEnabled: settings.modelingFeatureEnabled,
              modelingMinFollowers: settings.modelingMinFollowers,
              modelingPhotoshootLabel: settings.modelingPhotoshootLabel,
              modelingVideoAdsLabel: settings.modelingVideoAdsLabel,

              // Brand Ambassadorship feature settings
              brandAmbassadorshipEnabled: settings.brandAmbassadorshipEnabled,
              brandAmbassadorshipMinFollowers: settings.brandAmbassadorshipMinFollowers,
              brandAmbassadorshipPricingLabel: settings.brandAmbassadorshipPricingLabel,
              brandAmbassadorshipPreferencesLabel: settings.brandAmbassadorshipPreferencesLabel,

              updatedAt: new Date(),
            },
            create: {
              id: "settings",
              // Default values for required fields
              maxImageSize: 5242880,
              minVideoDuration: 3,
              maxVideoDuration: 60,
              timezone: "Asia/Kolkata",

              // Feature toggles
              likesEnabled: settings.likesEnabled ?? true,
              commentsEnabled: settings.commentsEnabled ?? true,
              sharingEnabled: settings.sharingEnabled ?? true,
              messagingEnabled: settings.messagingEnabled ?? true,
              userBlockingEnabled: settings.userBlockingEnabled ?? true,
              loginActivityTrackingEnabled: settings.loginActivityTrackingEnabled ?? true,
              viewsEnabled: settings.viewsEnabled ?? true,
              bookmarksEnabled: settings.bookmarksEnabled ?? true,
              advertisementsEnabled: settings.advertisementsEnabled ?? true,
              showStickeredAdvertisements: settings.showStickeredAdvertisements ?? true,

              // Modeling feature settings
              modelingFeatureEnabled: settings.modelingFeatureEnabled ?? false,
              modelingMinFollowers: settings.modelingMinFollowers ?? 1000,
              modelingPhotoshootLabel: settings.modelingPhotoshootLabel ?? "Photoshoot Price Per Day",
              modelingVideoAdsLabel: settings.modelingVideoAdsLabel ?? "Video Ads Note",

              // Brand Ambassadorship feature settings
              brandAmbassadorshipEnabled: settings.brandAmbassadorshipEnabled ?? false,
              brandAmbassadorshipMinFollowers: settings.brandAmbassadorshipMinFollowers ?? 5000,
              brandAmbassadorshipPricingLabel: settings.brandAmbassadorshipPricingLabel ?? "Pricing Information",
              brandAmbassadorshipPreferencesLabel: settings.brandAmbassadorshipPreferencesLabel ?? "Brand Preferences",
            },
          });

          // Log the updated settings
          debug.log("Updated settings:", {
            modelingFeatureEnabled: updatedSettings.modelingFeatureEnabled,
            brandAmbassadorshipEnabled: updatedSettings.brandAmbassadorshipEnabled
          });

          return Response.json({
            success: true,
            message: "Feature settings updated successfully",
            settings: {
              modelingFeatureEnabled: updatedSettings.modelingFeatureEnabled,
              brandAmbassadorshipEnabled: updatedSettings.brandAmbassadorshipEnabled
            }
          });
        } catch (error) {
          debug.error("Error updating feature settings:", error);
          return Response.json({ error: "Failed to update feature settings" }, { status: 500 });
        }
        break;
      default:
        return Response.json(
          { error: "Invalid settings section" },
          { status: 400 }
        );
    }

    // Only reached for non-features sections
    return Response.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    debug.error("Error updating settings:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
