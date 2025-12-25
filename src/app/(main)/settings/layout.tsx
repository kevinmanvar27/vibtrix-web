import { validateRequest } from "@/auth";
import { Settings, Shield } from "lucide-react";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import UserAvatar from "@/components/UserAvatar";
import SettingsNav from "./SettingsNav";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: {
    default: "Settings",
    template: "%s | Settings",
  },
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-6xl p-5">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-full">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full md:w-72">
          <div className="sticky top-24 rounded-2xl bg-card p-5 shadow-sm border border-border/40">
            <div className="flex items-center gap-3 mb-6 p-2">
              <UserAvatar avatarUrl={user.avatarUrl} size={40} showStatus={true} status={user.onlineStatus as any} />
              <div>
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            <Separator className="mb-4" />

            <div className="mb-3 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs uppercase font-medium text-muted-foreground tracking-wider">Settings</h3>
                </div>

              </div>
            </div>

            <SettingsNav />
          </div>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
