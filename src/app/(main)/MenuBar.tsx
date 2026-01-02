import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getFeatureSettings } from "@/lib/get-feature-settings";
import { Bookmark, Home, Trophy } from "lucide-react";
import Link from "next/link";
import MessagesButtonWrapper from "./MessagesButtonWrapper";
import NotificationsButtonWrapper from "./NotificationsButtonWrapper";
import RequireAuth from "@/components/RequireAuth";
import { cache } from "react";

// Cache the unread counts to prevent multiple database calls
const getUnreadCounts = cache(async (userId: string) => {
  let unreadNotificationsCount = 0;
  let unreadMessagesCount = 0;

  try {
    // Run both queries in parallel
    const [notifCount, msgCount] = await Promise.all([
      prisma.notification.count({
        where: {
          recipientId: userId,
          read: false,
        },
      }),
      prisma.chatParticipant.count({
        where: {
          userId: userId,
          hasUnread: true,
        },
      }).catch(() => 0), // Return 0 if table doesn't exist
    ]);

    unreadNotificationsCount = notifCount;
    unreadMessagesCount = msgCount;
  } catch (error) {
    // Default to 0 if there's an error
  }

  return { unreadNotificationsCount, unreadMessagesCount };
});

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const { user } = await validateRequest();
  const { bookmarksEnabled } = await getFeatureSettings();

  // Get unread counts only if user is logged in
  const { unreadNotificationsCount, unreadMessagesCount } = user 
    ? await getUnreadCounts(user.id)
    : { unreadNotificationsCount: 0, unreadMessagesCount: 0 };

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Home"
        asChild
      >
        <Link href="/" prefetch={true}>
          <Home />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>

      {/* Wrap interactive elements with RequireAuth */}
      <RequireAuth>
        <NotificationsButtonWrapper
          initialState={{ unreadCount: unreadNotificationsCount }}
        />
      </RequireAuth>

      <RequireAuth>
        <MessagesButtonWrapper initialState={{ unreadCount: unreadMessagesCount }} />
      </RequireAuth>

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Competitions"
        asChild
      >
        <Link href="/competitions" prefetch={true}>
          <Trophy />
          <span className="hidden lg:inline">Competitions</span>
        </Link>
      </Button>

      {bookmarksEnabled && (
        <RequireAuth>
          <Button
            variant="ghost"
            className="flex items-center justify-start gap-3"
            title="Bookmarks"
            asChild
          >
            <Link href="/bookmarks" prefetch={true}>
              <Bookmark />
              <span className="hidden lg:inline">Bookmarks</span>
            </Link>
          </Button>
        </RequireAuth>
      )}
    </div>
  );
}
