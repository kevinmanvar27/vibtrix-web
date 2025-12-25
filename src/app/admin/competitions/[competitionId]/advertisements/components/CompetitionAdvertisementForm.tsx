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
import { createCompetitionAdvertisement, updateCompetitionAdvertisement } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Megaphone, ImageIcon, Link2, Clock, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import MediaUploader from "@/components/admin/MediaUploader";

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
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface CompetitionAdvertisementFormProps {
  competitionId: string;
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

export default function CompetitionAdvertisementForm({
  competitionId,
  advertisement,
  mode = 'create'
}: CompetitionAdvertisementFormProps) {
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

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      debug.log("Form values:", values);

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (mode === 'edit' && advertisement) {
        await updateCompetitionAdvertisement(advertisement.id, competitionId, formData);
        toast({
          title: "Advertisement updated",
          description: "The advertisement has been updated successfully.",
        });
      } else {
        await createCompetitionAdvertisement(competitionId, formData);
        toast({
          title: "Advertisement created",
          description: "The advertisement has been created successfully.",
        });
      }

      // Redirect back to the advertisements list
      router.push(`/admin/competitions/${competitionId}/advertisements`);
      router.refresh();
    } catch (error: any) {
      debug.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save advertisement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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

            <div className="grid gap-6 mt-6 md:grid-cols-2">
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
                        <SelectItem value="IMAGE">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>Image</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="VIDEO">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                            <span>Video</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of advertisement you want to create.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="https://example.com" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The URL where users will be directed when they click on the advertisement.
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
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Media Upload</h3>
            </div>

            <FormField
              control={form.control}
              name="mediaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertisement Media</FormLabel>
                  <FormControl>
                    <MediaUploader
                      onMediaUploaded={handleMediaUploaded}
                      mediaType={adType}
                      mediaId={field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload the {adType.toLowerCase()} for your advertisement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Display Settings</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="skipDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skip Duration (seconds)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input type="number" min={1} {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      How long users must wait before they can skip the advertisement.
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
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <Input type="number" min={1} {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      How often the advertisement appears (every X posts).
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

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduleDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the advertisement will start showing.
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
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the advertisement will stop showing.
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
                      Set the initial status of the advertisement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/competitions/${competitionId}/advertisements`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : mode === 'edit' ? (
              "Update Advertisement"
            ) : (
              "Create Advertisement"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
