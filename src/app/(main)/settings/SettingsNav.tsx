"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Ban, Bell, Eye, UserPlus, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeatureSettings } from "@/hooks/use-feature-settings";

export default function SettingsNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { userBlockingEnabled, loginActivityTrackingEnabled } = useFeatureSettings();

  return (
    <nav className="space-y-1">
      {userBlockingEnabled && (
        <Link
          href="/settings/blocked"
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2.5 transition-colors",
            isActive("/settings/blocked")
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Ban className="size-4" />
            <span>Blocked Users</span>
          </div>

        </Link>
      )}

      <Link
        href="/settings/notifications"
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2.5 transition-colors",
          isActive("/settings/notifications")
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <Bell className="size-4" />
          <span>Notifications</span>
        </div>

      </Link>

      <Link
        href="/settings/privacy"
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2.5 transition-colors",
          isActive("/settings/privacy")
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <Eye className="size-4" />
          <span>Privacy</span>
        </div>

      </Link>

      <Link
        href="/settings/follow-requests"
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2.5 transition-colors",
          isActive("/settings/follow-requests")
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-accent text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <UserPlus className="size-4" />
          <span>Follow Requests</span>
        </div>

      </Link>

      {loginActivityTrackingEnabled && (
        <Link
          href="/settings/login-activity"
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2.5 transition-colors",
            isActive("/settings/login-activity")
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Shield className="size-4" />
            <span>Login Activity</span>
          </div>

        </Link>
      )}
    </nav>
  );
}
