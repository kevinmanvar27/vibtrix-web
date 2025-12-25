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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";
import debug from "@/lib/debug";

// Define the form schema
const formSchema = z.object({
  firebaseEnabled: z.boolean().default(false),
  firebaseApiKey: z.string().optional(),
  firebaseAuthDomain: z.string().optional(),
  firebaseProjectId: z.string().optional(),
  firebaseStorageBucket: z.string().optional(),
  firebaseMessagingSenderId: z.string().optional(),
  firebaseAppId: z.string().optional(),
  firebaseMeasurementId: z.string().optional(),
  pushNotificationsEnabled: z.boolean().default(false),
});

type FirebaseSettingsFormValues = z.infer<typeof formSchema>;

interface FirebaseSettingsFormProps {
  settings: any;
}

export function FirebaseSettingsForm({ settings }: FirebaseSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values
  const form = useForm<FirebaseSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firebaseEnabled: settings.firebaseEnabled || false,
      firebaseApiKey: settings.firebaseApiKey || "",
      firebaseAuthDomain: settings.firebaseAuthDomain || "",
      firebaseProjectId: settings.firebaseProjectId || "",
      firebaseStorageBucket: settings.firebaseStorageBucket || "",
      firebaseMessagingSenderId: settings.firebaseMessagingSenderId || "",
      firebaseAppId: settings.firebaseAppId || "",
      firebaseMeasurementId: settings.firebaseMeasurementId || "",
      pushNotificationsEnabled: settings.pushNotificationsEnabled || false,
    },
  });

  // Handle form submission
  async function onSubmit(values: FirebaseSettingsFormValues) {
    try {
      setIsSubmitting(true);

      // Make API request to update settings
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "firebase",
          settings: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update Firebase settings");
      }

      toast.success("Firebase settings updated successfully");
    } catch (error) {
      debug.error("Error updating Firebase settings:", error);
      toast.error("Failed to update Firebase settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="firebaseEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Firebase</FormLabel>
                <FormDescription>
                  Enable Firebase integration for push notifications and other features.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("firebaseEnabled") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firebaseApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase API Key" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firebaseAuthDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase Auth Domain" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firebaseProjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase Project ID" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firebaseStorageBucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Bucket</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase Storage Bucket" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firebaseMessagingSenderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Messaging Sender ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase Messaging Sender ID" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firebaseAppId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase App ID" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firebaseMeasurementId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Firebase Measurement ID" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pushNotificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Push Notifications</FormLabel>
                    <FormDescription>
                      Allow users to receive push notifications on their devices.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </Form>
  );
}
