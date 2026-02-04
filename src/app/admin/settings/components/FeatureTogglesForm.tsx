"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Heart, Share2, MessageCircle, Ban, Activity, Eye, Bookmark, MonitorPlay, Image, Camera, ShoppingBag, Users, Briefcase } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import debug from "@/lib/debug";

const featureTogglesSchema = z.object({
  likesEnabled: z.boolean(),
  commentsEnabled: z.boolean(),
  sharingEnabled: z.boolean(),
  messagingEnabled: z.boolean(),
  userBlockingEnabled: z.boolean(),
  loginActivityTrackingEnabled: z.boolean(),
  viewsEnabled: z.boolean(),
  bookmarksEnabled: z.boolean(),
  advertisementsEnabled: z.boolean(),
  showStickeredAdvertisements: z.boolean(),

  // Modeling feature
  modelingFeatureEnabled: z.boolean(),
  modelingMinFollowers: z.coerce.number().int().min(0),
  modelingPhotoshootLabel: z.string().optional(),
  modelingVideoAdsLabel: z.string().optional(),

  // Brand Ambassadorship feature
  brandAmbassadorshipEnabled: z.boolean(),
  brandAmbassadorshipMinFollowers: z.coerce.number().int().min(0),
  brandAmbassadorshipPricingLabel: z.string().optional(),
  brandAmbassadorshipPreferencesLabel: z.string().optional(),
});

type FeatureToggles = {
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

  // Modeling feature
  modelingFeatureEnabled?: boolean;
  modelingMinFollowers?: number;
  modelingPhotoshootLabel?: string;
  modelingVideoAdsLabel?: string;

  // Brand Ambassadorship feature
  brandAmbassadorshipEnabled?: boolean;
  brandAmbassadorshipMinFollowers?: number;
  brandAmbassadorshipPricingLabel?: string;
  brandAmbassadorshipPreferencesLabel?: string;
};

interface FeatureTogglesFormProps {
  settings: FeatureToggles;
}

export function FeatureTogglesForm({ settings }: FeatureTogglesFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof featureTogglesSchema>>({
    resolver: zodResolver(featureTogglesSchema),
    defaultValues: {
      likesEnabled: settings.likesEnabled,
      commentsEnabled: settings.commentsEnabled,
      sharingEnabled: settings.sharingEnabled,
      messagingEnabled: settings.messagingEnabled,
      userBlockingEnabled: settings.userBlockingEnabled,
      loginActivityTrackingEnabled: settings.loginActivityTrackingEnabled,
      viewsEnabled: settings.viewsEnabled,
      bookmarksEnabled: settings.bookmarksEnabled,
      advertisementsEnabled: settings.advertisementsEnabled ?? true,
      showStickeredAdvertisements: settings.showStickeredAdvertisements ?? true,

      // Modeling feature
      modelingFeatureEnabled: settings.modelingFeatureEnabled ?? false,
      modelingMinFollowers: settings.modelingMinFollowers ?? 1000,
      modelingPhotoshootLabel: settings.modelingPhotoshootLabel ?? "Photoshoot Price Per Day",
      modelingVideoAdsLabel: settings.modelingVideoAdsLabel ?? "Video Ads Note",

      // Brand Ambassadorship feature
      brandAmbassadorshipEnabled: settings.brandAmbassadorshipEnabled ?? false,
      brandAmbassadorshipMinFollowers: settings.brandAmbassadorshipMinFollowers ?? 5000,
      brandAmbassadorshipPricingLabel: settings.brandAmbassadorshipPricingLabel ?? "Pricing Information",
      brandAmbassadorshipPreferencesLabel: settings.brandAmbassadorshipPreferencesLabel ?? "Brand Preferences",
    },
  });

  async function onSubmit(values: z.infer<typeof featureTogglesSchema>) {
    setIsSubmitting(true);
    try {


      // Update feature toggles
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "features",
          settings: values,
        }),
      });

      const result = await response.json();

      toast({
        title: "Settings updated",
        description: "Feature toggles have been updated successfully.",
      });
    } catch (error) {
      debug.error("Error updating feature toggles:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="likesEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <FormLabel className="text-base">Likes</FormLabel>
                </div>
                <FormDescription>Like posts</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commentsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <FormLabel className="text-base">Comments</FormLabel>
                </div>
                <FormDescription>Comment on posts</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sharingEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-green-500" />
                  <FormLabel className="text-base">Sharing</FormLabel>
                </div>
                <FormDescription>Share posts</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="messagingEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-500" />
                  <FormLabel className="text-base">Messaging</FormLabel>
                </div>
                <FormDescription>Send messages</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userBlockingEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-orange-500" />
                  <FormLabel className="text-base">User Blocking</FormLabel>
                </div>
                <FormDescription>Block other users</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="loginActivityTrackingEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-500" />
                  <FormLabel className="text-base">Login Activity Tracking</FormLabel>
                </div>
                <FormDescription>Track login activity</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="viewsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-500" />
                  <FormLabel className="text-base">View Counts</FormLabel>
                </div>
                <FormDescription>Show view counts</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bookmarksEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-yellow-500" />
                  <FormLabel className="text-base">Bookmarks</FormLabel>
                </div>
                <FormDescription>Bookmark posts</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="advertisementsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="h-4 w-4 text-pink-500" />
                  <FormLabel className="text-base">Advertisements</FormLabel>
                </div>
                <FormDescription>Show advertisements</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="showStickeredAdvertisements"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 h-full">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-purple-500" />
                  <FormLabel className="text-base">Stickered Media in Feed</FormLabel>
                </div>
                <FormDescription>Show stickered media in feed (For You and Following)</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />


        </div>

        <h3 className="text-lg font-medium mt-8 mb-4">Modeling & Brand Ambassadorship Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modeling Feature */}
          <div className="col-span-2 md:col-span-1 rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-5 w-5 text-blue-500" />
              <h4 className="text-base font-medium">Modeling Feature</h4>
            </div>

            <FormField
              control={form.control}
              name="modelingFeatureEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Modeling Feature</FormLabel>
                    <FormDescription>
                      Allow users with sufficient followers to offer modeling services
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelingMinFollowers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Followers Required</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Users need at least this many followers to access the modeling feature
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelingPhotoshootLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photoshoot Price Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Label shown to users for photoshoot pricing field
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelingVideoAdsLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Ads Note Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Label shown to users for video ads participation field
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          {/* Brand Ambassadorship Feature */}
          <div className="col-span-2 md:col-span-1 rounded-lg border p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-green-500" />
              <h4 className="text-base font-medium">Brand Ambassadorship Feature</h4>
            </div>

            <FormField
              control={form.control}
              name="brandAmbassadorshipEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Brand Ambassadorship</FormLabel>
                    <FormDescription>
                      Allow users with sufficient followers to offer brand ambassadorship services
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandAmbassadorshipMinFollowers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Followers Required</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Users need at least this many followers to access the brand ambassadorship feature
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandAmbassadorshipPricingLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Information Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Label shown to users for pricing information field
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandAmbassadorshipPreferencesLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Preferences Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Label shown to users for brand preferences field
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-6">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
