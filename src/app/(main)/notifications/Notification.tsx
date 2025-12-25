import UserAvatar from "@/components/UserAvatar";
import FollowBackButton from "@/components/FollowBackButton";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import { Heart, MessageCircle, User2, UserPlus, Check, Users } from "lucide-react";
import Link from "next/link";
import NotificationFollowRequest from "./NotificationFollowRequest";
import NotificationFollowAccepted from "./NotificationFollowAccepted";
import NotificationFollow from "./NotificationFollow";
import NotificationMutualFollow from "./NotificationMutualFollow";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  // Special handling for follow-related notifications
  if (notification.type === "FOLLOW_REQUEST") {
    return <NotificationFollowRequest notification={notification as any} />;
  }

  if (notification.type === "FOLLOW_REQUEST_ACCEPTED") {
    return <NotificationFollowAccepted notification={notification} />;
  }

  if (notification.type === "FOLLOW") {
    return <NotificationFollow notification={notification} />;
  }

  if (notification.type === "MUTUAL_FOLLOW") {
    return <NotificationMutualFollow notification={notification} />;
  }
  const notificationTypeMap: Record<
    NotificationType,
    { message: string; icon: JSX.Element; href: string }
  > = {
    FOLLOW: {
      message: `${notification.issuer.displayName} followed you`,
      icon: <User2 className="size-7 text-primary" />,
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      message: `${notification.issuer.displayName} commented on your post`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    LIKE: {
      message: `${notification.issuer.displayName} liked your post`,
      icon: <Heart className="size-7 fill-red-500 text-red-500" />,
      href: `/posts/${notification.postId}`,
    },
    SHARE: {
      message: `${notification.issuer.displayName} shared your post`,
      icon: <MessageCircle className="size-7 fill-primary text-primary" />,
      href: `/posts/${notification.postId}`,
    },
    FOLLOW_REQUEST: {
      message: `${notification.issuer.displayName} requested to follow you`,
      icon: <UserPlus className="size-7 text-blue-500" />,
      href: `/settings/follow-requests`,
    },
    FOLLOW_REQUEST_ACCEPTED: {
      message: `${notification.issuer.displayName} accepted your follow request`,
      icon: <Check className="size-7 text-green-500" />,
      href: `/users/${notification.issuer.username}`,
    },
    MUTUAL_FOLLOW: {
      message: `${notification.issuer.displayName} followed you back. You are now connected!`,
      icon: <Users className="size-7 text-primary" />,
      href: `/users/${notification.issuer.username}`,
    },
  };

  const { message, icon, href } = notificationTypeMap[notification.type];

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-card/70",
          !notification.read && "bg-primary/10",
        )}
      >
        <div className="flex-1 space-y-3">
          <UserAvatar
            avatarUrl={notification.issuer.avatarUrl}
            size={36}
            showStatus={true}
            statusSize="sm"
          />
          <div>
            <span className="font-bold">{notification.issuer.displayName}</span>{" "}
            <span>{message}</span>
          </div>
          {notification.post && (
            <div className="line-clamp-3 whitespace-pre-line text-muted-foreground">
              {notification.post.content}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
