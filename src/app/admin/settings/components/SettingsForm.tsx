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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { updateSettings, uploadLogo, removeLogo, uploadFavicon, removeFavicon } from "../actions";
import Image from "next/image";
import { Loader2, Upload, Trash2 } from "lucide-react";

import debug from "@/lib/debug";

// Media settings removed as requested

const appearanceSettingsSchema = z.object({
  logoUrl: z.string().optional().nullable(),
  logoHeight: z.coerce.number().int().min(1, "Must be at least 1 pixel").optional().nullable(),
  logoWidth: z.coerce.number().int().min(1, "Must be at least 1 pixel").optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
});

const generalSettingsSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
});

const authSettingsSchema = z.object({
  googleLoginEnabled: z.boolean(),
  manualSignupEnabled: z.boolean(),
});


type SiteSettings = {
  id: string;
  maxImageSize: number;
  minVideoDuration: number;
  maxVideoDuration: number;
  logoUrl: string | null;
  logoHeight: number | null;
  logoWidth: number | null;
  faviconUrl: string | null;
  googleLoginEnabled: boolean;
  manualSignupEnabled: boolean;
  timezone: string;
};

interface SettingsFormProps {
  settings: SiteSettings;
  section: "appearance" | "auth" | "general";
}

export default function SettingsForm({ settings, section }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isRemovingFavicon, setIsRemovingFavicon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Create form based on section
  let formSchema;
  let defaultValues: any = {};

  switch (section) {
    case "appearance":
      formSchema = appearanceSettingsSchema;
      defaultValues = {
        logoUrl: settings.logoUrl || "",
        logoHeight: settings.logoHeight || 30,
        logoWidth: settings.logoWidth || 150,
        faviconUrl: settings.faviconUrl || "",
      };
      break;
    case "general":
      formSchema = generalSettingsSchema;
      defaultValues = {
        timezone: settings.timezone || "Asia/Kolkata",
      };
      break;
    case "auth":
      formSchema = authSettingsSchema;
      defaultValues = {
        googleLoginEnabled: settings.googleLoginEnabled,
        manualSignupEnabled: settings.manualSignupEnabled,
      };
      break;
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(values: any) {
    setIsSubmitting(true);
    try {

      // Only update the fields for the current section
      const result = await updateSettings({ ...settings, ...values });

      if (result.success) {
        toast({
          title: "Settings updated",
          description: "The settings have been updated successfully.",
        });


      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update settings. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render different form fields based on section
  const renderFormFields = () => {
    switch (section) {
      case "general":
        return (
          <>
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Timezone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India (Asia/Kolkata)</SelectItem>
                      <SelectItem value="Asia/Calcutta">India (Asia/Calcutta)</SelectItem>
                      <SelectItem value="Asia/Karachi">Pakistan (Asia/Karachi)</SelectItem>
                      <SelectItem value="Asia/Dhaka">Bangladesh (Asia/Dhaka)</SelectItem>
                      <SelectItem value="Asia/Colombo">Sri Lanka (Asia/Colombo)</SelectItem>
                      <SelectItem value="Asia/Kathmandu">Nepal (Asia/Kathmandu)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Default timezone for the application. Asia/Kolkata is the standard timezone for India.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "appearance":

        const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadLogo(formData);

            if (result.success && result.fileUrl) {
              form.setValue('logoUrl', result.fileUrl);

              toast({
                title: "Logo uploaded",
                description: "The logo has been uploaded successfully.",
              });
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to upload logo. Please try again.",
                variant: "destructive",
              });
            }
          } catch (error) {
            debug.error(error);
            toast({
              title: "Error",
              description: "Failed to upload logo. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsUploading(false);
          }
        };

        const handleRemoveLogo = async () => {
          try {
            setIsRemoving(true);
            const result = await removeLogo();

            if (result.success) {
              form.setValue('logoUrl', '');

              toast({
                title: "Logo removed",
                description: "The logo has been removed successfully.",
              });
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to remove logo. Please try again.",
                variant: "destructive",
              });
            }
          } catch (error) {
            debug.error(error);
            toast({
              title: "Error",
              description: "Failed to remove logo. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsRemoving(false);
          }
        };

        const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;

          try {
            setIsUploadingFavicon(true);
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadFavicon(formData);

            if (result.success && result.fileUrl) {
              form.setValue('faviconUrl', result.fileUrl);

              toast({
                title: "Favicon uploaded",
                description: "The favicon has been uploaded successfully.",
              });
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to upload favicon. Please try again.",
                variant: "destructive",
              });
            }
          } catch (error) {
            debug.error(error);
            toast({
              title: "Error",
              description: "Failed to upload favicon. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsUploadingFavicon(false);
          }
        };

        const handleRemoveFavicon = async () => {
          try {
            setIsRemovingFavicon(true);
            const result = await removeFavicon();

            if (result.success) {
              form.setValue('faviconUrl', '');

              toast({
                title: "Favicon removed",
                description: "The favicon has been removed successfully.",
              });
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to remove favicon. Please try again.",
                variant: "destructive",
              });
            }
          } catch (error) {
            debug.error(error);
            toast({
              title: "Error",
              description: "Failed to remove favicon. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsRemovingFavicon(false);
          }
        };

        return (
          <>
            <div className="space-y-6">
              {/* Logo Section */}
              <FormItem>
                <FormLabel>Site Logo</FormLabel>
                <div className="flex flex-col gap-4">
                  {form.watch('logoUrl') && (
                    <div className="relative h-20 w-40 overflow-hidden rounded-md border">
                      <Image
                        src={form.watch('logoUrl')}
                        alt="Site Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </Button>

                    {form.watch('logoUrl') && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRemoveLogo}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Logo
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <FormDescription>
                    Upload your site logo. Recommended size: 150x30px.
                  </FormDescription>
                </div>
              </FormItem>

              {/* Logo Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logoWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Width (px)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Width of the logo in pixels
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo Height (px)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Height of the logo in pixels
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Favicon Section */}
              <FormItem>
                <FormLabel>Site Favicon</FormLabel>
                <div className="flex flex-col gap-4">
                  {form.watch('faviconUrl') && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                      <Image
                        src={form.watch('faviconUrl')}
                        alt="Site Favicon"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={faviconInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFaviconUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={isUploadingFavicon}
                    >
                      {isUploadingFavicon ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Favicon
                        </>
                      )}
                    </Button>

                    {form.watch('faviconUrl') && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRemoveFavicon}
                        disabled={isRemovingFavicon}
                      >
                        {isRemovingFavicon ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Favicon
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <FormDescription>
                    Upload your site favicon. Recommended size: 32x32px or 64x64px.
                  </FormDescription>
                </div>
              </FormItem>
            </div>
          </>
        );
      case "auth":
        return (
          <>
            <FormField
              control={form.control}
              name="googleLoginEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Google Login</FormLabel>
                    <FormDescription>
                      Allow users to sign in with Google.
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
              name="manualSignupEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Manual Signup</FormLabel>
                    <FormDescription>
                      Allow users to create accounts with username and password.
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
          </>
        );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {renderFormFields()}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  );
}
