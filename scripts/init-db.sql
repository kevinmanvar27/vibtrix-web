-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'settings',
    "maxImageSize" INTEGER NOT NULL DEFAULT 5242880,
    "minVideoDuration" INTEGER NOT NULL DEFAULT 3,
    "maxVideoDuration" INTEGER NOT NULL DEFAULT 60,
    "logoUrl" TEXT,
    "googleLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
    "manualSignupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "paytmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phonePeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gPayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default site settings if not exists
INSERT INTO "site_settings" ("id", "updatedAt") 
VALUES ('settings', NOW()) 
ON CONFLICT ("id") DO NOTHING;