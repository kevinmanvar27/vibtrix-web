import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { Bell } from "lucide-react";
import { notFound } from "next/navigation";
import NotificationSettingsClient from "./NotificationSettingsClient";

export const metadata = {
  title: "Notification Settings",
};

export default async function NotificationSettingsPage() {
  const { user } = await validateRequest();

  if (!user) {
    return notFound();
  }

  // Get user notification preferences
  const preferences = await prisma.userNotificationPreferences.findUnique({
    where: {
      userId: user.id,
    },
  });

  // If no preferences exist yet, use default values
  const notificationPreferences = preferences || {
    likeNotifications: true,
    followNotifications: true,
    commentNotifications: true,
  };

  return (
    <main className="w-full">
      <NotificationSettingsClient preferences={notificationPreferences} />
    </main>
  );
}
