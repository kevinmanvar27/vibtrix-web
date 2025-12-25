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
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import debug from "@/lib/debug";

// Define the form schema
const formSchema = z.object({
  googleAnalyticsEnabled: z.boolean().default(false),
  googleAnalyticsId: z.string().optional().nullable(),
});

type GoogleAnalyticsSettingsFormValues = z.infer<typeof formSchema>;

interface GoogleAnalyticsSettingsFormProps {
  settings: Partial<GoogleAnalyticsSettingsFormValues>;
}

export function GoogleAnalyticsSettingsForm({ settings }: GoogleAnalyticsSettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form with default values
  const form = useForm<GoogleAnalyticsSettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      googleAnalyticsEnabled: settings.googleAnalyticsEnabled || false,
      googleAnalyticsId: settings.googleAnalyticsId || "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: GoogleAnalyticsSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "analytics",
          settings: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update settings");
      }

      toast({
        title: "Settings updated",
        description: "Google Analytics settings have been updated successfully.",
      });
    } catch (error) {
      debug.error("Error updating Google Analytics settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="googleAnalyticsEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <FormLabel className="text-base">Enable Google Analytics</FormLabel>
                </div>
                <FormDescription>
                  Track website usage and visitor statistics with Google Analytics
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

        {form.watch("googleAnalyticsEnabled") && (
          <FormField
            control={form.control}
            name="googleAnalyticsId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Analytics Measurement ID</FormLabel>
                <FormDescription>
                  Enter your Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="G-XXXXXXXXXX"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
