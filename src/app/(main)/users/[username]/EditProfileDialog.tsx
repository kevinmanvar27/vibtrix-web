import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import CropImageDialog from "@/components/CropImageDialog";
import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/use-toast";
import { UserData } from "@/lib/types";
import {
  updateUserProfileSchema,
  UpdateUserProfileValues,
} from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, User, AtSign, FileText, Calendar, UserCircle, CreditCard, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe, ExternalLink, DollarSign, Briefcase, ShoppingBag, IndianRupee } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import Image, { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Resizer from "react-image-file-resizer";
import { useUpdateProfileMutation } from "./mutations";

import debug from "@/lib/debug";

// Helper function to format date from DD-MM-YYYY to YYYY-MM-DD for input
function formatDateForInput(dateString: string | null | undefined) {
  // If no date, return empty string
  if (!dateString || dateString.trim() === '') return '';

  try {
    // Check if the date is in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');

      // Validate the date parts
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
        debug.warn('Invalid date parts in DD-MM-YYYY format:', dateString);
        return '';
      }

      // Return in YYYY-MM-DD format for the date input
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // If it's already in YYYY-MM-DD format, validate and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');

      // Validate the date parts
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
        debug.warn('Invalid date parts in YYYY-MM-DD format:', dateString);
        return '';
      }

      return dateString;
    }

    // Try to handle other formats
    // Check for DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Check for YYYY/MM/DD format
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // If it's in an unknown format, try to extract digits
    const digitsOnly = dateString.replace(/\D/g, '');
    if (digitsOnly.length === 8) {
      // Assume DDMMYYYY format
      const day = digitsOnly.substring(0, 2);
      const month = digitsOnly.substring(2, 4);
      const year = digitsOnly.substring(4, 8);

      // Validate parts
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        return `${year}-${month}-${day}`;
      }
    }

    // If all else fails, return empty string
    debug.warn('Unknown date format:', dateString);
    return '';
  } catch (error) {
    debug.error('Error formatting date for input:', error);
    return '';
  }
}

interface EditProfileDialogProps {
  user: UserData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Function to check if browser supports date input type
function isDateInputSupported() {
  // Safe check for browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true; // Default to true for SSR
  }

  try {
    const input = document.createElement('input');
    input.setAttribute('type', 'date');

    const notADateValue = 'not-a-date';
    input.setAttribute('value', notADateValue);

    // If browser supports date input, it will ignore the non-date value
    return input.value !== notADateValue;
  } catch (error) {
    debug.error('Error checking date input support:', error);
    return true; // Default to true on error
  }
}

export default function EditProfileDialog({
  user,
  open,
  onOpenChange,
}: EditProfileDialogProps) {

  // Get feature settings
  const {
    modelingFeatureEnabled,
    modelingMinFollowers,
    modelingPhotoshootLabel,
    modelingVideoAdsLabel,
    brandAmbassadorshipEnabled,
    brandAmbassadorshipMinFollowers,
    brandAmbassadorshipPricingLabel,
    brandAmbassadorshipPreferencesLabel
  } = useFeatureSettings();

  // Reference to the date input for DOB
  const dobDateInputRef = useRef<HTMLInputElement>(null);

  // Initialize date input when dialog opens
  useEffect(() => {
    if (open) {
      // Add click handler to date input to ensure it opens the date picker
      const dateInput = dobDateInputRef.current;
      if (dateInput) {
        // Force the date input to be clickable
        const clickHandler = () => {
          try {
            // Try to open the date picker programmatically
            if (typeof dateInput.showPicker === 'function') {
              dateInput.showPicker();
            }
          } catch (error) {
            // Fallback for browsers that don't support showPicker
            debug.log('Date picker showPicker not supported');
          }
        };

        dateInput.addEventListener('click', clickHandler);

        // Set initial value if available
        if (user.dateOfBirth) {
          const formattedDate = formatDateForInput(user.dateOfBirth);
          if (formattedDate) {
            dateInput.value = formattedDate;
          }
        }

        return () => {
          dateInput.removeEventListener('click', clickHandler);
        };
      }
    }
  }, [open, user.dateOfBirth]);
  // Parse social links from JSON if available
  const parseSocialLinks = () => {
    if (!user.socialLinks) return {};
    try {
      return typeof user.socialLinks === 'object' ? user.socialLinks : JSON.parse(user.socialLinks as string);
    } catch (e) {
      debug.error('Error parsing social links:', e);
      return {};
    }
  };

  const socialLinks = parseSocialLinks();

  const form = useForm<UpdateUserProfileValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      bio: user.bio || "",
      gender: user.gender || "",
      whatsappNumber: user.whatsappNumber || "",
      dateOfBirth: formatDateForInput(user.dateOfBirth),
      upiId: user.upiId || "",
      socialLinks: {
        instagram: socialLinks?.instagram || "",
        facebook: socialLinks?.facebook || "",
        twitter: socialLinks?.twitter || "",
        youtube: socialLinks?.youtube || "",
        linkedin: socialLinks?.linkedin || "",
        tiktok: socialLinks?.tiktok || "",
        website: socialLinks?.website || "",
      },

      // Modeling feature fields
      interestedInModeling: user.interestedInModeling || false,
      photoshootPricePerDay: user.photoshootPricePerDay || undefined,
      videoAdsParticipation: user.videoAdsParticipation || false,

      // Brand Ambassadorship feature fields
      interestedInBrandAmbassadorship: user.interestedInBrandAmbassadorship || false,
      brandAmbassadorshipPricing: user.brandAmbassadorshipPricing || "",
      brandPreferences: user.brandPreferences || "",
    },
  });

  const mutation = useUpdateProfileMutation();
  const { toast } = useToast();

  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);

  async function onSubmit(values: UpdateUserProfileValues) {
    let newAvatarFile = undefined;

    // Validate required fields for Modeling
    if (values.interestedInModeling) {
      const missingFields = [];

      if (!values.dateOfBirth) {
        missingFields.push("Date of Birth");
        form.setError("dateOfBirth", {
          type: "manual",
          message: "Date of Birth is required for modeling"
        });
      }

      if (!values.whatsappNumber) {
        missingFields.push("WhatsApp Number");
        form.setError("whatsappNumber", {
          type: "manual",
          message: "Contact number is required for modeling"
        });
      }

      if (!values.gender) {
        missingFields.push("Gender");
        form.setError("gender", {
          type: "manual",
          message: "Gender is required for modeling"
        });
      }

      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Missing required information",
          description: `Please provide your ${missingFields.join(", ")} to enable modeling.`
        });
        return;
      }
    }

    // Validate required fields for Brand Ambassadorship
    if (values.interestedInBrandAmbassadorship) {
      const missingFields = [];

      if (!values.dateOfBirth) {
        missingFields.push("Date of Birth");
        form.setError("dateOfBirth", {
          type: "manual",
          message: "Date of Birth is required for brand ambassadorship"
        });
      }

      if (!values.whatsappNumber) {
        missingFields.push("WhatsApp Number");
        form.setError("whatsappNumber", {
          type: "manual",
          message: "Contact number is required for brand ambassadorship"
        });
      }

      if (!values.gender) {
        missingFields.push("Gender");
        form.setError("gender", {
          type: "manual",
          message: "Gender is required for brand ambassadorship"
        });
      }

      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Missing required information",
          description: `Please provide your ${missingFields.join(", ")} to enable brand ambassadorship.`
        });
        return;
      }
    }

    if (croppedAvatar) {
      try {
        // Create a unique filename with timestamp to avoid caching issues
        const filename = `avatar_${user.id}_${Date.now()}.webp`;
        newAvatarFile = new File([croppedAvatar], filename, {
          type: 'image/webp'
        });
        // Avatar file created successfully
      } catch (error) {
        debug.error('Error creating avatar file:', error);
        toast({
          variant: "destructive",
          description: "Error preparing avatar image",
        });
      }
    }

    mutation.mutate(
      {
        values,
        avatar: newAvatarFile,
      },
      {
        onSuccess: (data) => {
          setCroppedAvatar(null);
          onOpenChange(false);

          // Check if username has changed and redirect to the new profile URL
          const updatedUsername = data?.updatedUser?.username;
          const currentUsername = user.username;

          if (updatedUsername && updatedUsername !== currentUsername) {
            debug.log(`Username changed from ${currentUsername} to ${updatedUsername}, redirecting...`);
            // Use a small delay to ensure the dialog is closed before redirecting
            setTimeout(() => {
              // Force a hard navigation to the new URL
              window.location.href = `/users/${updatedUsername}`;
            }, 200);
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <AvatarInput
            src={
              croppedAvatar
                ? URL.createObjectURL(croppedAvatar)
                : user.avatarUrl || avatarPlaceholder
            }
            onImageCropped={setCroppedAvatar}
          />
          <p className="text-xs text-muted-foreground mt-2">Click to change your profile picture</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Display name
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Your display name"
                          className="pl-8"
                          {...field}
                        />
                        <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                      Username
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Your username"
                          className="pl-8"
                          {...field}
                        />
                        <AtSign className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Bio
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Tell us a little bit about yourself"
                        className="resize-none min-h-[100px] pl-8 pt-6"
                        {...field}
                      />
                      <FileText className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      Gender
                      {(form.watch("interestedInModeling") || form.watch("interestedInBrandAmbassadorship")) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          {...field}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                        <UserCircle className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Date of Birth
                      {(form.watch("interestedInModeling") || form.watch("interestedInBrandAmbassadorship")) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="date"
                          id="dob-date-input"
                          ref={dobDateInputRef}
                          placeholder="Select date"
                          value={field.value ? formatDateForInput(field.value) : ''}
                          onClick={(e) => {
                            try {
                              // Try to open the date picker programmatically
                              const input = e.currentTarget as HTMLInputElement;
                              if (typeof input.showPicker === 'function') {
                                input.showPicker();
                              }
                            } catch (error) {
                              debug.log('Date picker showPicker not supported');
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (!value) {
                              field.onChange(undefined);
                              return;
                            }

                            // Convert from YYYY-MM-DD to DD-MM-YYYY for storage
                            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                              const [year, month, day] = value.split('-');
                              const formattedValue = `${day}-${month}-${year}`;
                              field.onChange(formattedValue);
                            } else {
                              field.onChange(value);
                            }
                          }}
                          max={new Date().toISOString().split('T')[0]} // Prevent future dates
                          className="w-full pl-8 cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                        />
                        <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <div
                          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                          onClick={() => {
                            try {
                              // Try to open the date picker programmatically
                              if (dobDateInputRef.current && typeof dobDateInputRef.current.showPicker === 'function') {
                                dobDateInputRef.current.showPicker();
                              } else if (dobDateInputRef.current) {
                                // Fallback: focus and click the input
                                dobDateInputRef.current.focus();
                                dobDateInputRef.current.click();
                              }
                            } catch (error) {
                              debug.log('Date picker interaction failed:', error);
                            }
                          }}
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* UPI ID Field */}
            <FormField
              control={form.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    UPI ID / GPay Number
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          placeholder="Your UPI ID or GPay number (e.g. username@upi)"
                          className="pl-8"
                          {...field}
                        />
                        <CreditCard className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                        Your UPI ID is only used for prize payments when you win competitions. It is not displayed on your profile and is only accessible to administrators for payment purposes. You can enter either:
                        <br />• A UPI ID (like username@upi or username@bank)
                        <br />• Your 10-digit phone number linked to GPay
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Modeling Section - Only show if enabled and user has enough followers */}
            {modelingFeatureEnabled && user._count.followers >= (modelingMinFollowers || 0) && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="font-medium text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-500" />
                  Modeling
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enable these options if you're interested in modeling opportunities.
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    Note: Date of Birth, Gender, and WhatsApp Number are required for modeling.
                  </span>
                </p>

                <FormField
                  control={form.control}
                  name="interestedInModeling"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Interested in Modeling</FormLabel>
                        <FormDescription>
                          Make your profile visible to brands looking for models
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

                {form.watch("interestedInModeling") && (
                  <div className="space-y-4 pl-2 border-l-2 border-blue-200">
                    <FormField
                      control={form.control}
                      name="photoshootPricePerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{modelingPhotoshootLabel || "Photoshoot Price Per Day"}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter your rate in INR"
                                className="pl-8"
                                {...field}
                                onChange={(e) => {
                                  // Only allow digits
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  e.target.value = value;
                                  field.onChange(value === "" ? undefined : parseFloat(value));
                                }}
                                value={field.value === undefined || field.value === null ? "" : field.value}
                              />
                              <IndianRupee className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your daily rate for photoshoots (in INR)
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="videoAdsParticipation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>{modelingVideoAdsLabel || "Video Ads Participation"}</FormLabel>
                            <FormDescription>
                              Willing to participate in video advertisements
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
                  </div>
                )}
              </div>
            )}

            {/* Brand Ambassadorship Section - Only show if enabled and user has enough followers */}
            {brandAmbassadorshipEnabled && user._count.followers >= (brandAmbassadorshipMinFollowers || 0) && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="font-medium text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-green-500" />
                  Brand Ambassadorship
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enable these options if you're interested in brand ambassadorship opportunities.
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    Note: Date of Birth, Gender, and WhatsApp Number are required for brand ambassadorship.
                  </span>
                </p>

                <FormField
                  control={form.control}
                  name="interestedInBrandAmbassadorship"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Interested in Brand Ambassadorship</FormLabel>
                        <FormDescription>
                          Make your profile visible to brands looking for ambassadors
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

                {form.watch("interestedInBrandAmbassadorship") && (
                  <div className="space-y-4 pl-2 border-l-2 border-green-200">
                    <FormField
                      control={form.control}
                      name="brandAmbassadorshipPricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{brandAmbassadorshipPricingLabel || "Pricing Information"}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter your pricing amount in INR"
                                className="pl-8"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  // Only allow digits
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  e.target.value = value;
                                  field.onChange(value);
                                }}
                              />
                              <IndianRupee className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Describe your pricing structure for brand partnerships (in INR)
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="brandPreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{brandAmbassadorshipPreferencesLabel || "Brand Preferences"}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="flex items-center">
                                <ShoppingBag className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                                <TagInput
                                  placeholder="Type brand or industry and press Enter, Space or comma"
                                  className="pl-8"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Add brands or industries you're interested in representing
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Social Media Links Section */}
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="font-medium text-base flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                Social Media Links
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram */}
                <FormField
                  control={form.control}
                  name="socialLinks.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Input
                          placeholder="Instagram profile URL"
                          className="pl-8"
                          {...field}
                        />
                        <Instagram className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Facebook */}
                <FormField
                  control={form.control}
                  name="socialLinks.facebook"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Input
                          placeholder="Facebook profile URL"
                          className="pl-8"
                          {...field}
                        />
                        <Facebook className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Twitter/X */}
                <FormField
                  control={form.control}
                  name="socialLinks.twitter"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Input
                          placeholder="X/Twitter profile URL"
                          className="pl-8"
                          {...field}
                        />
                        <Twitter className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp */}
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <WhatsAppIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        WhatsApp Number
                        {(form.watch("interestedInModeling") || form.watch("interestedInBrandAmbassadorship")) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </FormLabel>
                      <div className="relative">
                        <Input
                          placeholder="Your WhatsApp number (e.g. +1234567890)"
                          className="pl-8"
                          {...field}
                        />
                        <WhatsAppIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormDescription>
                        {(form.watch("interestedInModeling") || form.watch("interestedInBrandAmbassadorship")) &&
                          "Required for modeling and brand ambassadorship inquiries"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LinkedIn */}
                <FormField
                  control={form.control}
                  name="socialLinks.linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Input
                          placeholder="LinkedIn profile URL"
                          className="pl-8"
                          {...field}
                        />
                        <Linkedin className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Website */}
                <FormField
                  control={form.control}
                  name="socialLinks.website"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Input
                          placeholder="Your website URL"
                          className="pl-8"
                          {...field}
                        />
                        <Globe className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-6 sticky bottom-0 bg-background pb-2">
              <LoadingButton
                type="submit"
                loading={mutation.isPending}
                className="w-full sm:w-auto"
              >
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface AvatarInputProps {
  src: string | StaticImageData;
  onImageCropped: (blob: Blob | null) => void;
}

function AvatarInput({ src, onImageCropped }: AvatarInputProps) {
  const [imageToCrop, setImageToCrop] = useState<File>();
  const [error, setError] = useState<string>();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  function onImageSelected(image: File | undefined) {
    if (!image) return;

    // Reset any previous errors
    setError(undefined);

    // Validate file type
    if (!image.type.startsWith('image/')) {
      setError('Please select an image file');
      toast({
        variant: "destructive",
        description: "Please select an image file",
      });
      return;
    }

    // Validate file size (5MB)
    if (image.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      toast({
        variant: "destructive",
        description: "Image must be smaller than 5MB",
      });
      return;
    }

    try {
      Resizer.imageFileResizer(
        image,
        1024,
        1024,
        "WEBP",
        90, // Reduced quality to help with file size
        0,
        (uri) => {
          if (uri instanceof File) {
            setImageToCrop(uri);
          } else {
            setError('Failed to process image');
            toast({
              variant: "destructive",
              description: "Failed to process image",
            });
          }
        },
        "file",
      );
    } catch (err) {
      debug.error('Image processing error:', err);
      setError('Failed to process image');
      toast({
        variant: "destructive",
        description: "Failed to process image",
      });
    }
  }

  return (
    <>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onImageSelected(e.target.files?.[0])}
        ref={fileInputRef}
        className="sr-only hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative block hover:scale-105 transition-transform duration-200"
      >
        <Image
          src={src}
          alt="Avatar preview"
          width={150}
          height={150}
          className="size-36 flex-none rounded-full object-cover border-4 border-background shadow-md"
        />
        <span className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-primary/70 text-white transition-colors duration-200 group-hover:bg-primary/90 opacity-0 group-hover:opacity-100">
          <Camera size={24} />
        </span>
      </button>
      {imageToCrop && (
        <CropImageDialog
          src={URL.createObjectURL(imageToCrop)}
          cropAspectRatio={1}
          onCropped={onImageCropped}
          onClose={() => {
            setImageToCrop(undefined);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        />
      )}
    </>
  );
}
