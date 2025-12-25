import { z } from "zod";

// Define the required string schema
const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString.min(8, "Must be at least 8 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: z.string().trim().default(""),
  mediaIds: z.array(z.string()).max(5, "Cannot have more than 5 attachments"),
});

// Define a schema for social media links
const socialLinksSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(), // X/Twitter
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
}).optional();

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  bio: z.string().max(1000, "Must be at most 1000 characters"),
  gender: z.string().optional(),
  whatsappNumber: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional, so empty is valid
      // Basic validation for WhatsApp number (should start with + and contain only digits)
      return /^\+?[0-9]+$/.test(val);
    },
    { message: "Invalid WhatsApp number format" }
  ),
  dateOfBirth: z.string().optional()
    .transform(val => {
      if (!val || val === "") return undefined;

      // If already in DD-MM-YYYY format, return as is
      if (/^\d{2}-\d{2}-\d{4}$/.test(val)) {
        return val;
      }

      // If in YYYY-MM-DD format, convert to DD-MM-YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [year, month, day] = val.split('-');
        return `${day}-${month}-${year}`;
      }

      // Return as is for any other format
      return val;
    }),
  upiId: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional, so empty is valid
      // Basic validation for UPI ID format
      return /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/i.test(val) || /^[0-9]+@[a-zA-Z0-9]+$/i.test(val);
    },
    { message: "Invalid UPI ID format. Should be like username@upi or number@upi" }
  ),
  socialLinks: socialLinksSchema,

  // Modeling feature fields
  interestedInModeling: z.boolean().optional().default(false),
  photoshootPricePerDay: z.coerce.number().optional().nullable(),
  videoAdsParticipation: z.boolean().optional().default(false),

  // Brand Ambassadorship feature fields
  interestedInBrandAmbassadorship: z.boolean().optional().default(false),
  brandAmbassadorshipPricing: z.string().optional().nullable(),
  brandPreferences: z.string().optional().nullable(),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});
