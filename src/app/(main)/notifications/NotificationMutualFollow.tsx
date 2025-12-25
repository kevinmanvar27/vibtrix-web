"use client";

import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useFeatureSettings } from "@/hooks/use-feature-settings";

interface NotificationMutualFollowProps {
  notification: NotificationData;
}

export default function NotificationMutualFollow({
  notification,
}: NotificationMutualFollowProps) {
  const featureSettings = useFeatureSettings();

  return (
    <div className={cn(
      "flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors",
      !notification.read && "bg-primary/10",
    )}>
      <div className="flex-1 space-y-3">
        <Link href={`/users/${notification.issuer.username}`}>
          <UserAvatar
            avatarUrl={notification.issuer.avatarUrl}
            size={36}
            showStatus={true}
            statusSize="sm"
          />
        </Link>
        <div>
          <Link href={`/users/${notification.issuer.username}`} className="hover:underline">
            <span className="font-bold">{notification.issuer.displayName}</span>
          </Link>{" "}
          <span>followed you back. You are now connected!</span>
        </div>
        {featureSettings.messagingEnabled && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              asChild
            >
              <Link href={`/messages?user=${notification.issuer.username}`}>
                <MessageSquare className="size-4" />
                <span>Message</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
