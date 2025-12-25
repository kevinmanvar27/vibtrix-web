import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getFeatureSettings } from "@/lib/get-feature-settings";

import { Bookmark, Home, Trophy } from "lucide-react";
import Link from "next/link";
import MessagesButtonWrapper from "./MessagesButtonWrapper";
import NotificationsButtonWrapper from "./NotificationsButtonWrapper";
import RequireAuth from "@/components/RequireAuth";

import debug from "@/lib/debug";

interface MenuBarProps {
  className?: string;
}

export default async function MenuBar({ className }: MenuBarProps) {
  const { user } = await validateRequest();
  const { bookmarksEnabled } = await getFeatureSettings();

  // Get unread counts only if user is logged in
  let unreadNotificationsCount = 0;
  let unreadMessagesCount = 0;

  if (user) {
    // Get unread notifications count from database
    try {
      unreadNotificationsCount = await prisma.notification.count({
        where: {
          recipientId: user.id,
          read: false,
        },
      });
    } catch (error) {
      debug.error('Error getting unread notifications count:', error);
      // Default to 0 if there's an error
    }

    // Get unread messages count from database
    try {
      // First check if the ChatParticipant table exists
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'chat_participants'
        );
      `;

      const exists = Array.isArray(tableExists) && tableExists.length > 0 && tableExists[0].exists;

      if (exists) {
        // Use a simple count query if the table exists
        const count = await prisma.chatParticipant.count({
          where: {
            userId: user.id,
            hasUnread: true,
          },
        });
        unreadMessagesCount = count;
      }
    } catch (error) {
      debug.error('Error getting unread messages count:', error);
      // Default to 0 if there's an error or the model doesn't exist yet
    }
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Home"
        asChild
      >
        <Link href="/">
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
        <Link href="/competitions">
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
            <Link href="/bookmarks">
              <Bookmark />
              <span className="hidden lg:inline">Bookmarks</span>
            </Link>
          </Button>
        </RequireAuth>
      )}
    </div>
  );
}
