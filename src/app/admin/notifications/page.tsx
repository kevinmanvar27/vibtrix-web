import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cleanDuplicateNotifications } from "@/lib/notification-utils";
import { Bell } from "lucide-react";
import { notFound } from "next/navigation";
import CleanNotificationsButton from "./CleanNotificationsButton";

export const metadata = {
  title: "Notification Management",
};

export default async function NotificationsPage() {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    return notFound();
  }

  return (
    <main className="w-full space-y-6">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notification Management</h1>
            <p className="text-sm text-muted-foreground">Manage system notifications</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clean Duplicate Notifications</CardTitle>
            <CardDescription>
              Remove duplicate notifications from the database to improve performance and user experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              This action will identify and remove duplicate notifications, keeping only the most recent one for each unique combination of issuer, recipient, type, and related content.
            </p>
            <CleanNotificationsButton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
