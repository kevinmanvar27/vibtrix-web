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
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvertisementStatus, MediaType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createAdvertisement, updateAdvertisement } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, LayoutGrid, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MediaUploader from "./MediaUploader";
import { Card, CardContent } from "@/components/ui/card";

import debug from "@/lib/debug";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  adType: z.enum(["IMAGE", "VIDEO"]),
  mediaId: z.string().min(1, "Media is required"),
  skipDuration: z.coerce.number().min(1, "Skip duration must be at least 1 second"),
  displayFrequency: z.coerce.number().min(1, "Display frequency must be at least 1"),
  scheduleDate: z.date(),
  expiryDate: z.date(),
  status: z.enum(["ACTIVE", "PAUSED", "SCHEDULED", "EXPIRED"]),
  url: z.string().url("Please enter a valid URL").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdvertisementFormProps {
  advertisement?: {
    id: string;
    title: string;
    adType: MediaType;
    mediaId: string;
    skipDuration: number;
    displayFrequency: number;
    scheduleDate: Date;
    expiryDate: Date;
    status: AdvertisementStatus;
    url?: string;
  };
  mode?: 'create' | 'edit';
}

export default function AdvertisementForm({ advertisement, mode = 'create' }: AdvertisementFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: advertisement ? {
      title: advertisement.title,
      adType: advertisement.adType,
      mediaId: advertisement.mediaId,
      skipDuration: advertisement.skipDuration,
      displayFrequency: advertisement.displayFrequency,
      scheduleDate: new Date(advertisement.scheduleDate),
      expiryDate: new Date(advertisement.expiryDate),
      status: advertisement.status,
      url: advertisement.url || "",
    } : {
      title: "",
      adType: "IMAGE",
      mediaId: "",
      skipDuration: 5,
      displayFrequency: 5,
      scheduleDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "SCHEDULED",
      url: "",
    },
  });

  const adType = form.watch("adType");

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("adType", data.adType);
      formData.append("mediaId", data.mediaId);
      formData.append("skipDuration", data.skipDuration.toString());
      formData.append("displayFrequency", data.displayFrequency.toString());
      formData.append("scheduleDate", data.scheduleDate.toISOString());
      formData.append("expiryDate", data.expiryDate.toISOString());
      formData.append("status", data.status);
      if (data.url) {
        formData.append("url", data.url);
      }

      if (mode === 'create') {
        await createAdvertisement(formData);
        toast({
          title: "Advertisement created",
          description: "Your advertisement has been created successfully.",
        });
      } else if (mode === 'edit' && advertisement) {
        await updateAdvertisement(advertisement.id, formData);
        toast({
          title: "Advertisement updated",
          description: "Your advertisement has been updated successfully.",
        });
      }

      router.push("/admin/advertisements");
    } catch (error) {
      debug.error(`Error ${mode === 'create' ? 'creating' : 'updating'} advertisement:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode === 'create' ? 'create' : 'update'} advertisement`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaUploaded = (mediaId: string) => {
    form.setValue("mediaId", mediaId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Basic Information</h3>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter advertisement title" {...field} />
                  </FormControl>
                  <FormDescription>
                    This title is for internal reference only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-6">
              <FormField
                control={form.control}
                name="adType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advertisement Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select advertisement type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether this advertisement will be an image or a video.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1 rounded-md bg-primary/10">
                {adType === "IMAGE" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
                )}
              </div>
              <h3 className="text-lg font-medium">Media Content</h3>
            </div>

            <FormField
              control={form.control}
              name="mediaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertisement Media</FormLabel>
                  <FormControl>
                    <MediaUploader
                      type={adType as MediaType}
                      onMediaUploaded={handleMediaUploaded}
                      value={field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload the {adType.toLowerCase()} for this advertisement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      When users click on the advertisement, they will be redirected to this URL in a new tab.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Display Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="skipDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skip Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      How many seconds before users can skip this ad.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Frequency</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormDescription>
                      Show ad after every X posts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Schedule</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="scheduleDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Schedule Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      When this advertisement should start showing.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      When this advertisement should stop showing.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the initial status of this advertisement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/advertisements")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (mode === 'create' ? "Creating..." : "Updating...")
              : (mode === 'create' ? "Create Advertisement" : "Update Advertisement")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
