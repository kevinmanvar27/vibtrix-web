import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import Notifications from "./Notifications";
import { validateRequest } from "@/auth";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function Page() {
  const { user } = await validateRequest();

  // If user is not logged in, show a message instead of the notifications
  if (!user) {
    return (
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-5">
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <h1 className="text-center text-2xl font-bold">Notifications</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-12 bg-card rounded-2xl p-5 shadow-sm">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You need to be logged in to view your notifications.
            </p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
        <TrendsSidebar />
      </main>
    );
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Notifications</h1>
        </div>
        <Notifications />
      </div>
      <TrendsSidebar />
    </main>
  );
}
