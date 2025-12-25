import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import FeedSettingsClientWrapper from "./FeedSettingsClientWrapper";
import DynamicTabs from "./DynamicTabs";

import debug from "@/lib/debug";

export default async function FeedSettingsPage() {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin-login");
  }

  // Check if advertisements feature is enabled
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        advertisementsEnabled: true,
        showStickeredAdvertisements: true,
        showFeedStickers: true,
      },
    });

    // Only redirect if settings exist and advertisements are explicitly disabled
    if (settings && settings.advertisementsEnabled === false) {
      redirect("/admin/settings");
    }

    return (
      <FeedSettingsClientWrapper
        showFeedStickers={settings?.showFeedStickers ?? true}
        showStickeredMedia={settings?.showStickeredAdvertisements ?? true}
      >
        <div className="container py-10">
          <Card className="border-none shadow-none bg-transparent mb-8">
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Feed Media Settings</CardTitle>
              </div>
              <CardDescription className="text-base mt-2">
                Configure how media is displayed in the feed sections ('For You' and 'Following').
              </CardDescription>
            </CardHeader>
          </Card>

          <DynamicTabs
            initialShowFeedStickers={settings?.showFeedStickers ?? true}
            initialShowStickeredMedia={settings?.showStickeredAdvertisements ?? true}
          />
        </div>
      </FeedSettingsClientWrapper>
    );
  } catch (error) {
    debug.error("Error checking advertisement settings:", error);
    // Continue without redirecting if there's an error
    return (
      <FeedSettingsClientWrapper
        showFeedStickers={true}
        showStickeredMedia={true}
      >
        <div className="container py-10">
          <Card className="border-none shadow-none bg-transparent mb-8">
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Feed Media Settings</CardTitle>
              </div>
              <CardDescription className="text-base mt-2">
                Configure how media is displayed in the feed sections ('For You' and 'Following').
              </CardDescription>
            </CardHeader>
          </Card>

          <DynamicTabs
            initialShowFeedStickers={true}
            initialShowStickeredMedia={true}
          />
        </div>
      </FeedSettingsClientWrapper>
    );
  }
}
