import { z } from "zod";

// Define the required string schema
const requiredString = z.string().trim().min(1, "Required");

export const signUpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Only letters, numbers, - and _ allowed",
  ),
  password: requiredString
    .min(8, "Must be at least 8 characters")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least one special character"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: z.string().trim().default(""),
  mediaIds: z.array(z.string()).max(5, "Cannot have more than 5 attachments").default([]),
}).refine(
  (data) => data.content.length > 0 || data.mediaIds.length > 0,
  {
    message: "Post must have either content or media attachments",
    path: ["content"],
  }
);

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

// Additional validation schemas for various API endpoints
export const competitionParticipationSchema = z.object({
  competitionId: requiredString,
  entryData: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    mediaUrls: z.array(z.string().url()).optional(),
  }),
});

export const paymentVerificationSchema = z.object({
  razorpay_payment_id: requiredString,
  razorpay_order_id: requiredString,
  razorpay_signature: requiredString,
});

export const createCompetitionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  rules: z.string().optional(),
  prizePool: z.coerce.number().positive("Prize pool must be positive"),
  startDate: z.string(),
  endDate: z.string(),
  entryFee: z.coerce.number().nonnegative("Entry fee cannot be negative").optional(),
  maxParticipants: z.coerce.number().int().positive("Max participants must be positive").optional(),
});

export const messageSchema = z.object({
  content: requiredString.max(5000, "Message too long (max 5000 characters)"),
  recipientId: requiredString,
  mediaUrl: z.string().url().optional(),
});

export const reportContentSchema = z.object({
  contentType: z.enum(["post", "comment", "user"]),
  contentId: requiredString,
  reason: z.enum(["spam", "harassment", "hate_speech", "nsfw", "violence", "other"]),
  description: z.string().max(1000, "Description too long (max 1000 characters)").optional(),
});

export const notificationPreferenceSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  followNotifications: z.boolean().optional(),
  likeNotifications: z.boolean().optional(),
  commentNotifications: z.boolean().optional(),
  competitionNotifications: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: requiredString.email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: requiredString,
  newPassword: requiredString
    .min(8, "Must be at least 8 characters")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least one special character"),
});

export const verifyOtpSchema = z.object({
  email: requiredString.email("Invalid email address"),
  otp: requiredString.length(6, "OTP must be 6 digits"),
});

export const createChatSchema = z.object({
  participantIds: z.array(z.string()).min(2, "Chat must have at least 2 participants"),
  name: z.string().optional(),
  isGroup: z.boolean().default(false),
});

export const sendMessageSchema = z.object({
  chatId: requiredString,
  content: z.string().trim().max(5000, "Message too long"),
  mediaUrl: z.string().url().optional(),
  messageType: z.enum(["text", "image", "video", "file"]).default("text"),
});

export const bookmarkPostSchema = z.object({
  postId: requiredString,
});

export const likePostSchema = z.object({
  postId: requiredString,
});

export const followUserSchema = z.object({
  userId: requiredString,
});

export const uploadMediaSchema = z.object({
  mediaType: z.enum(["image", "video"]),
  mediaId: requiredString,
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().optional(),
  privacy: z.object({
    isProfilePublic: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    showWhatsappNumber: z.boolean().optional(),
    showDob: z.boolean().optional(),
    showFullDob: z.boolean().optional(),
    showUpiId: z.boolean().optional(),
  }).optional(),
});

export const adminLoginSchema = z.object({
  usernameOrEmail: requiredString,
  password: requiredString,
});

export const createAdvertisementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  imageUrl: z.string().url("Must be a valid URL"),
  targetUrl: z.string().url("Must be a valid URL").optional(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.coerce.number().positive("Budget must be positive"),
  targetType: z.enum(["impression", "click"]).default("impression"),
});

export const feedbackSchema = z.object({
  category: z.enum(["bug", "feature", "general"]),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const searchSchema = z.object({
  query: z.string().trim().min(1, "Search query is required").max(500),
  type: z.enum(["users", "posts", "competitions", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
