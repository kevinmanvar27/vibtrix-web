"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Trophy, Bell, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { NotificationCountInfo, MessageCountInfo } from "@/lib/types";
import { useEffect, useState } from "react";

import debug from "@/lib/debug";

export default function MobileNavBar() {
  const { user, isLoggedIn } = useSession();
  const pathname = usePathname();
  const featureSettings = useFeatureSettings();
  const { notificationsEnabled, messagingEnabled } = featureSettings;
  const [isMobile, setIsMobile] = useState(true);

  // Debug log to see feature settings
  useEffect(() => {
    debug.log("Feature settings in MobileNavBar:", featureSettings);
    debug.log("Is messaging enabled:", messagingEnabled);
    debug.log("Is user logged in:", isLoggedIn);
  }, [featureSettings, messagingEnabled, isLoggedIn]);

  // Always force mobile navigation to be visible on small screens
  useEffect(() => {
    // Force mobile navigation to be visible initially
    setIsMobile(true);

    // Function to check if device is mobile
    const checkMobile = () => {
      // Always show on mobile screens (width < 640px)
      const isMobileWidth = window.innerWidth < 640;

      // Also check user agent for better detection on tablets/mobile devices
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Set as mobile if either condition is true
      setIsMobile(isMobileWidth || isMobileDevice);
    };

    // Set initial state
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Get unread notifications count
  const { data: notificationData } = useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<NotificationCountInfo>('/api/notifications/unread-count');
        return response.data;
      } catch (error) {
        return { unreadCount: 0 };
      }
    },
    initialData: { unreadCount: 0 },
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: typeof window !== 'undefined' && notificationsEnabled && isLoggedIn,
  });

  // Get unread messages count
  const { data: messageData } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<MessageCountInfo>('/api/messages/unread-count');
        return response.data;
      } catch (error) {
        return { unreadCount: 0 };
      }
    },
    initialData: { unreadCount: 0 },
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: typeof window !== 'undefined' && messagingEnabled && isLoggedIn,
  });

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  // Only render on client-side to avoid hydration issues
  if (typeof window === 'undefined') return null;

  // Check if we're on a mobile device (screen width < 640px)
  const isMobileScreen = window.innerWidth < 640;

  // Don't render on desktop or tablet
  if (!isMobileScreen) return null;

  // Log for debugging
  debug.log("MobileNavBar - Rendering mobile navigation");
  debug.log("MobileNavBar - Window width:", window.innerWidth);
  debug.log("MobileNavBar - Is mobile screen:", isMobileScreen);

  return (
    <nav className="mobile-nav md:hidden sm:hidden">
      <div className="mobile-nav-backdrop"></div>

      {/* Home */}
      <Link href="/" className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200">
        {isActive("/") ? (
          <Home className="h-7 w-7 text-primary fill-primary" />
        ) : (
          <Home className="h-6 w-6 text-foreground" />
        )}
      </Link>

      {/* Search */}
      <Link href="/search" className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200">
        {isActive("/search") ? (
          <Search className="h-7 w-7 text-primary" strokeWidth={2.5} />
        ) : (
          <Search className="h-6 w-6 text-foreground" />
        )}
      </Link>

      {/* Competitions */}
      <Link href="/competitions" className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200">
        {isActive("/competitions") ? (
          <Trophy className="h-7 w-7 text-primary fill-primary" />
        ) : (
          <Trophy className="h-6 w-6 text-foreground" />
        )}
      </Link>

      {/* Messages - Always show for testing */}
      <Link href="/messages" className="flex-1 flex items-center justify-center py-2 relative active:opacity-70 transition-opacity duration-200">
        {isActive("/messages") ? (
          <Mail className="h-7 w-7 text-primary fill-primary" />
        ) : (
          <Mail className="h-6 w-6 text-foreground" />
        )}
        {isLoggedIn && !!messageData.unreadCount && (
          <span className="absolute top-1 right-[calc(50%-12px)] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {messageData.unreadCount > 9 ? "9+" : messageData.unreadCount}
          </span>
        )}
      </Link>

      {/* Notifications - Only show for logged in users */}
      {notificationsEnabled && isLoggedIn && (
        <Link href="/notifications" className="flex-1 flex items-center justify-center py-2 relative active:opacity-70 transition-opacity duration-200">
          {isActive("/notifications") ? (
            <Bell className="h-7 w-7 text-primary fill-primary" />
          ) : (
            <Bell className="h-6 w-6 text-foreground" />
          )}
          {!!notificationData.unreadCount && (
            <span className="absolute top-1 right-[calc(50%-12px)] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {notificationData.unreadCount > 9 ? "9+" : notificationData.unreadCount}
            </span>
          )}
        </Link>
      )}

      {/* Profile - Show login button for guests, profile for logged in users */}
      {isLoggedIn && user ? (
        <Link href={`/users/${user.username}`} className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200">
          <div className={cn(
            "flex items-center justify-center rounded-full overflow-hidden",
            isActive(`/users/${user.username}`) ? "ring-2 ring-primary h-7 w-7" : "h-6 w-6"
          )}>
            <UserAvatar
              avatarUrl={user.avatarUrl}
              size={isActive(`/users/${user.username}`) ? 28 : 24}
              showStatus={false}
            />
          </div>
        </Link>
      ) : (
        <Link href="/login/google" className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200">
          <User className="h-6 w-6 text-foreground" />
        </Link>
      )}
    </nav>
  );
}
