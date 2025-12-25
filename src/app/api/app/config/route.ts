/**
 * API route for mobile app configuration
 * GET /api/app/config - Get app configuration (public endpoint)
 * 
 * Returns:
 * - Minimum app versions (for force update)
 * - Maintenance mode status
 * - Feature flags
 * - App store URLs
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

/**
 * GET /api/app/config
 * Public endpoint - no authentication required
 * Returns app configuration for mobile clients
 */
export async function GET(req: NextRequest) {
  try {
    debug.log("GET /api/app/config - Fetching app configuration");

    // Get site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        // Maintenance mode
        maintenanceMode: true,
        maintenanceMessage: true,

        // App version requirements
        minAppVersionIOS: true,
        minAppVersionAndroid: true,

        // App store URLs
        appStoreUrl: true,
        playStoreUrl: true,

        // Deep linking
        appDeepLinkScheme: true,
        appUniversalLinkDomain: true,

        // Feature flags
        likesEnabled: true,
        commentsEnabled: true,
        sharingEnabled: true,
        messagingEnabled: true,
        userBlockingEnabled: true,
        viewsEnabled: true,
        bookmarksEnabled: true,
        reportingEnabled: true,
        push_notifications_enabled: true,

        // Auth options
        googleLoginEnabled: true,
        manualSignupEnabled: true,

        // Media settings
        maxImageSize: true,
        minVideoDuration: true,
        maxVideoDuration: true,

        // Optional features
        brandAmbassadorshipEnabled: true,
        modelingFeatureEnabled: true,
      },
    });

    if (!settings) {
      debug.log("GET /api/app/config - Settings not found, returning defaults");
      // Return sensible defaults if settings don't exist
      return Response.json({
        maintenance: {
          enabled: false,
          message: null,
        },
        version: {
          minIOS: "1.0.0",
          minAndroid: "1.0.0",
        },
        stores: {
          appStore: null,
          playStore: null,
        },
        deepLinking: {
          scheme: "vidibattle",
          universalLinkDomain: null,
        },
        features: {
          likes: true,
          comments: true,
          sharing: true,
          messaging: true,
          blocking: true,
          views: true,
          bookmarks: true,
          reporting: true,
          pushNotifications: false,
          googleLogin: true,
          manualSignup: true,
          brandAmbassadorship: false,
          modeling: false,
        },
        media: {
          maxImageSize: 5242880,
          minVideoDuration: 3,
          maxVideoDuration: 60,
        },
      });
    }

    // Build response with organized structure
    const config = {
      maintenance: {
        enabled: settings.maintenanceMode,
        message: settings.maintenanceMessage,
      },
      version: {
        minIOS: settings.minAppVersionIOS || "1.0.0",
        minAndroid: settings.minAppVersionAndroid || "1.0.0",
      },
      stores: {
        appStore: settings.appStoreUrl,
        playStore: settings.playStoreUrl,
      },
      deepLinking: {
        scheme: settings.appDeepLinkScheme || "vidibattle",
        universalLinkDomain: settings.appUniversalLinkDomain,
      },
      features: {
        likes: settings.likesEnabled,
        comments: settings.commentsEnabled,
        sharing: settings.sharingEnabled,
        messaging: settings.messagingEnabled,
        blocking: settings.userBlockingEnabled,
        views: settings.viewsEnabled,
        bookmarks: settings.bookmarksEnabled,
        reporting: settings.reportingEnabled,
        pushNotifications: settings.push_notifications_enabled,
        googleLogin: settings.googleLoginEnabled,
        manualSignup: settings.manualSignupEnabled,
        brandAmbassadorship: settings.brandAmbassadorshipEnabled,
        modeling: settings.modelingFeatureEnabled,
      },
      media: {
        maxImageSize: settings.maxImageSize,
        minVideoDuration: settings.minVideoDuration,
        maxVideoDuration: settings.maxVideoDuration,
      },
    };

    debug.log("GET /api/app/config - Configuration retrieved successfully");

    return Response.json(config);
  } catch (error) {
    debug.error("GET /api/app/config - Error:", error);
    return Response.json(
      { error: "Failed to fetch app configuration" },
      { status: 500 }
    );
  }
}
