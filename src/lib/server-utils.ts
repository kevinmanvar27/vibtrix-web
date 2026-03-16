import { format, toZonedTime } from "date-fns-tz";
import prisma from "./prisma";

import debug from "@/lib/debug";

// Get the application timezone from settings
export async function getAppTimezone(): Promise<string> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { timezone: true },
    });
    return settings?.timezone || "Asia/Kolkata";
  } catch (error) {
    debug.error("Error fetching timezone:", error);
    return "Asia/Kolkata"; // Default to India timezone
  }
}

// Format a date using the application timezone
export async function formatDateWithTimezone(date: Date | string, formatStr: string): Promise<string> {
  const timezone = await getAppTimezone();
  const dateObj = date instanceof Date ? date : new Date(date);
  const zonedDate = toZonedTime(dateObj, timezone);
  return format(zonedDate, formatStr, { timeZone: timezone });
}
