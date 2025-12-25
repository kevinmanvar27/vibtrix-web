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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

import debug from "@/lib/debug";

const razorpaySettingsSchema = z.object({
  razorpayEnabled: z.boolean(),
  razorpayKeyId: z.string()
    .refine(val => !val || val.startsWith('rzp_'), {
      message: "Key ID must start with 'rzp_'"
    }),
  razorpayKeySecret: z.string()
    .refine(val => !val || val.length >= 20, {
      message: "Key Secret must be at least 20 characters long if provided"
    })
    .optional(),
});

type RazorpaySettings = {
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
};

interface RazorpaySettingsFormProps {
  settings: RazorpaySettings;
}

export function RazorpaySettingsForm({ settings }: RazorpaySettingsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string | null }>({ valid: false, message: null });

  const form = useForm<z.infer<typeof razorpaySettingsSchema>>({
    resolver: zodResolver(razorpaySettingsSchema),
    defaultValues: {
      razorpayEnabled: settings.razorpayEnabled,
      razorpayKeyId: settings.razorpayKeyId || "",
      razorpayKeySecret: "", // Don't show the secret key for security reasons
    },
  });

  // Function to validate Razorpay keys
  async function validateKeys(keyId: string, keySecret?: string) {
    if (!keyId || (keyId === settings.razorpayKeyId && !keySecret)) {
      // If no changes to keys, skip validation
      return { valid: true, message: null };
    }

    setIsValidating(true);
    try {
      // Call API to validate keys
      const response = await fetch('/api/admin/settings/validate-razorpay-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyId,
          keySecret: keySecret || undefined,
        }),
      });

      const data = await response.json();
      return {
        valid: data.valid,
        message: data.valid ? 'API keys validated successfully' : data.error
      };
    } catch (error) {
      debug.error('Error validating Razorpay keys:', error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Failed to validate API keys'
      };
    } finally {
      setIsValidating(false);
    }
  }

  async function onSubmit(values: z.infer<typeof razorpaySettingsSchema>) {
    setIsSubmitting(true);

    try {
      // Validate keys before saving if they've changed
      if (values.razorpayEnabled &&
          (values.razorpayKeyId !== settings.razorpayKeyId || values.razorpayKeySecret)) {
        const validation = await validateKeys(values.razorpayKeyId, values.razorpayKeySecret);
        setValidationResult(validation);

        if (!validation.valid) {
          toast({
            title: "Validation Failed",
            description: validation.message || "Failed to validate Razorpay API keys",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      // Create form data for the API request
      const formData = new FormData();
      formData.append("razorpayKeyId", values.razorpayKeyId || "");

      // Only include the secret if it's provided (to avoid overwriting with empty string)
      if (values.razorpayKeySecret) {
        formData.append("razorpayKeySecret", values.razorpayKeySecret);
      }

      // Update Razorpay keys
      const response = await fetch("/api/admin/settings/razorpay-keys", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update Razorpay settings");
      }

      // Update Razorpay enabled status
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "payment",
          settings: {
            razorpayEnabled: values.razorpayEnabled,
          },
        }),
      });

      // Show success message with validation result if available
      toast({
        title: "Settings updated",
        description: validationResult.valid && validationResult.message
          ? `Razorpay settings updated and keys validated successfully.`
          : "Razorpay settings have been updated successfully.",
      });

      // Reset validation result
      setValidationResult({ valid: false, message: null });
    } catch (error) {
      debug.error("Error updating Razorpay settings:", error);
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
      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Razorpay Configuration</AlertTitle>
        <AlertDescription>
          <p>To enable payments, you need to set up your Razorpay account:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Create an account at <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">razorpay.com</a></li>
            <li>Get your API keys from the Razorpay Dashboard</li>
            <li>Enter the Key ID (starts with 'rzp_test_' for test mode or 'rzp_live_' for live mode)</li>
            <li>Enter the Key Secret (keep this confidential)</li>
            <li>Enable Razorpay using the toggle switch</li>
          </ol>
          <div className="mt-2 text-xs">
            <p><strong>Note:</strong> For testing, use test mode keys. For production, use live mode keys.</p>
            <p>You can find your API keys in the <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Razorpay Dashboard &rarr; Settings &rarr; API Keys</a></p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Show validation result if available */}
      {validationResult.message && (
        <Alert className={`mb-4 ${validationResult.valid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            {validationResult.message}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="razorpayEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Razorpay</FormLabel>
                <FormDescription>
                  Allow users to make payments using Razorpay.
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

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="razorpayKeyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razorpay Key ID</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Your Razorpay API Key ID (starts with 'rzp_').
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="razorpayKeySecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razorpay Key Secret</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="Enter new secret key to update" />
                </FormControl>
                <FormDescription>
                  Your Razorpay API Secret Key. Leave blank to keep the current secret.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting || isValidating}>
            {isSubmitting ? "Saving..." : isValidating ? "Validating..." : "Save Changes"}
          </Button>

          {settings.razorpayKeyId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open("https://dashboard.razorpay.com", "_blank")}
              className="text-xs"
            >
              Open Razorpay Dashboard
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
