import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsForm from "./components/SettingsForm";
import CurrentTime from "@/components/CurrentTime";
import { RazorpaySettingsForm } from "./components/RazorpaySettingsForm";
import { FeatureTogglesForm } from "./components/FeatureTogglesForm";
import { FirebaseSettingsForm } from "./components/FirebaseSettingsForm";
import { GoogleAnalyticsSettingsForm } from "./components/GoogleAnalyticsSettingsForm";
import { RazorpayStatusAlert } from "@/components/admin/RazorpayStatusAlert";

import debug from "@/lib/debug";

export const metadata = {
  title: "Site Settings",
};

async function getSettings() {
  try {
    // First try to get settings from the database
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
    });

    // Return settings if they exist
    if (settings) {
      return settings;
    }

    // If no settings exist, return defaults
    return {
      id: "settings",
      maxImageSize: 5242880, // 5MB in bytes
      minVideoDuration: 3,
      maxVideoDuration: 60,
      logoUrl: null,
      logoHeight: 30,
      logoWidth: 150,
      faviconUrl: null,
      googleLoginEnabled: true,
      manualSignupEnabled: true,
      razorpayEnabled: false,
      razorpayKeyId: null,
      razorpayKeySecret: null,
      timezone: "Asia/Kolkata",
      // Firebase settings
      firebaseEnabled: false,
      firebaseApiKey: null,
      firebaseAuthDomain: null,
      firebaseProjectId: null,
      firebaseStorageBucket: null,
      firebaseMessagingSenderId: null,
      firebaseAppId: null,
      firebaseMeasurementId: null,
      pushNotificationsEnabled: false,
      // Google Analytics settings
      googleAnalyticsEnabled: false,
      googleAnalyticsId: null,
      // Feature toggles
      likesEnabled: true,
      commentsEnabled: true,
      sharingEnabled: true,
      messagingEnabled: true,
      userBlockingEnabled: true,
      loginActivityTrackingEnabled: true,
      viewsEnabled: true,
      bookmarksEnabled: true,

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
    debug.error("Error fetching settings:", error);

    // Return defaults if there's an error
    return {
      id: "settings",
      maxImageSize: 5242880,
      minVideoDuration: 3,
      maxVideoDuration: 60,
      logoUrl: null,
      logoHeight: 30,
      logoWidth: 150,
      faviconUrl: null,
      googleLoginEnabled: true,
      manualSignupEnabled: true,
      timezone: "Asia/Kolkata",
      // Firebase settings
      firebaseEnabled: false,
      firebaseApiKey: null,
      firebaseAuthDomain: null,
      firebaseProjectId: null,
      firebaseStorageBucket: null,
      firebaseMessagingSenderId: null,
      firebaseAppId: null,
      firebaseMeasurementId: null,
      pushNotificationsEnabled: false,
      // Google Analytics settings
      googleAnalyticsEnabled: false,
      googleAnalyticsId: null,
      // Feature toggles
      likesEnabled: true,
      commentsEnabled: true,
      sharingEnabled: true,
      messagingEnabled: true,
      userBlockingEnabled: true,
      loginActivityTrackingEnabled: true,
      viewsEnabled: true,
      bookmarksEnabled: true,

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
}

export const revalidate = 0; // Disable caching for this page

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  // Add a timestamp to force fresh data on each request
  const timestamp = Date.now();
  const settings = await getSettings();
  const defaultTab = searchParams.tab || "general";

  return (
    <div className="space-y-6">
      <RazorpayStatusAlert />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground">
          Configure global settings for your platform.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-7 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="firebase">Firebase</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm settings={settings} section="general" />
              <div className="mt-4 p-3 bg-muted rounded-md">
                <CurrentTime timezone={settings.timezone} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm settings={settings} section="appearance" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Configure login and signup options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm settings={settings} section="auth" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment gateway settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RazorpaySettingsForm settings={{
                razorpayEnabled: settings.razorpayEnabled ?? false,
                razorpayKeyId: settings.razorpayKeyId ?? null,
                razorpayKeySecret: settings.razorpayKeySecret ?? null
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="firebase" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Settings</CardTitle>
              <CardDescription>
                Configure Firebase for push notifications and other features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FirebaseSettingsForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Settings</CardTitle>
              <CardDescription>
                Configure Google Analytics to track website usage and visitor statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAnalyticsSettingsForm settings={settings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable specific features across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureTogglesForm settings={{
                likesEnabled: settings.likesEnabled,
                commentsEnabled: settings.commentsEnabled,
                sharingEnabled: settings.sharingEnabled,
                messagingEnabled: settings.messagingEnabled,
                userBlockingEnabled: settings.userBlockingEnabled,
                loginActivityTrackingEnabled: settings.loginActivityTrackingEnabled,
                viewsEnabled: settings.viewsEnabled,
                bookmarksEnabled: settings.bookmarksEnabled,
                advertisementsEnabled: (settings as any).advertisementsEnabled ?? true,
                showStickeredAdvertisements: (settings as any).showStickeredAdvertisements ?? true,

                // Modeling feature
                modelingFeatureEnabled: settings.modelingFeatureEnabled ?? undefined,
                modelingMinFollowers: settings.modelingMinFollowers ?? undefined,
                modelingPhotoshootLabel: settings.modelingPhotoshootLabel ?? undefined,
                modelingVideoAdsLabel: settings.modelingVideoAdsLabel ?? undefined,

                // Brand Ambassadorship feature
                brandAmbassadorshipEnabled: settings.brandAmbassadorshipEnabled ?? undefined,
                brandAmbassadorshipMinFollowers: settings.brandAmbassadorshipMinFollowers ?? undefined,
                brandAmbassadorshipPricingLabel: settings.brandAmbassadorshipPricingLabel ?? undefined,
                brandAmbassadorshipPreferencesLabel: settings.brandAmbassadorshipPreferencesLabel ?? undefined,
              }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
