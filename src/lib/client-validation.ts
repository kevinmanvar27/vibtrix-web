"use client";

import { z } from "zod";

// Define the required string schema
const requiredString = z.string().trim().min(1, "Required");

// Login schema
export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

// Update user profile schema
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
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

// Create post schema
export const createPostSchema = z.object({
  content: z.string().trim().default(""),
  mediaIds: z.array(z.string()).max(5, "Cannot have more than 5 attachments"),
});

// Create comment schema
export const createCommentSchema = z.object({
  content: requiredString,
});
