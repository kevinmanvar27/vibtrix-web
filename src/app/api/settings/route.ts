import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

export async function GET() {
  try {
    // Get site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        // Firebase settings
        firebase_enabled: true,
        firebase_api_key: true,
        firebase_auth_domain: true,
        firebase_project_id: true,
        firebase_storage_bucket: true,
        firebase_messaging_sender_id: true,
        firebase_app_id: true,
        firebase_measurement_id: true,
        push_notifications_enabled: true,

        // Feature settings
        likesEnabled: true,
        commentsEnabled: true,
        sharingEnabled: true,
        messagingEnabled: true,
        userBlockingEnabled: true,
        loginActivityTrackingEnabled: true,
        viewsEnabled: true,
        bookmarksEnabled: true,
        advertisementsEnabled: true,
        reportingEnabled: true,
      },
    });

    if (!settings) {
      return Response.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return Response.json(settings);
  } catch (error) {
    debug.error("Error fetching settings:", error);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
