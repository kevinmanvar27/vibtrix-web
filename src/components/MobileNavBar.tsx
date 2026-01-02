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
import { useEffect, useState, useMemo, useCallback, memo } from "react";

// Memoized nav item to prevent re-renders
const NavItem = memo(function NavItem({ 
  href, 
  isActive, 
  icon: Icon, 
  activeIcon: ActiveIcon,
  badge 
}: { 
  href: string; 
  isActive: boolean; 
  icon: typeof Home;
  activeIcon?: typeof Home;
  badge?: number;
}) {
  const IconComponent = isActive && ActiveIcon ? ActiveIcon : Icon;
  
  return (
    <Link 
      href={href} 
      prefetch={true}
      className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200 relative"
    >
      <IconComponent 
        className={cn(
          isActive ? "h-7 w-7 text-primary" : "h-6 w-6 text-foreground",
          isActive && "fill-primary"
        )} 
        strokeWidth={isActive ? 2.5 : 2}
      />
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-[calc(50%-12px)] flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
});

export default function MobileNavBar() {
  const { user, isLoggedIn } = useSession();
  const pathname = usePathname();
  const featureSettings = useFeatureSettings();
  const { messagingEnabled } = featureSettings;
  const notificationsEnabled = true;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoize isActive function
  const isActive = useCallback((path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  }, [pathname]);

  // Get unread notifications count - with longer stale time
  // Only fetch if user is definitely logged in (not just truthy, but has user object)
  const shouldFetchNotifications = isMounted && notificationsEnabled && isLoggedIn && !!user;
  const { data: notificationData } = useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: async () => {
      // Double-check we have a user before making the request
      if (!user) return { unreadCount: 0 };
      try {
        const response = await apiClient.get<NotificationCountInfo>('/api/notifications/unread-count');
        return response.data;
      } catch (error) {
        return { unreadCount: 0 };
      }
    },
    initialData: { unreadCount: 0 },
    refetchInterval: shouldFetchNotifications ? 30000 : false, // Only refetch if enabled
    staleTime: 15000, // Data stays fresh for 15 seconds
    refetchOnWindowFocus: false,
    enabled: shouldFetchNotifications,
    retry: false, // Don't retry on 401 errors
  });

  // Get unread messages count - with longer stale time
  const shouldFetchMessages = isMounted && messagingEnabled && isLoggedIn && !!user;
  const { data: messageData } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: async () => {
      // Double-check we have a user before making the request
      if (!user) return { unreadCount: 0 };
      try {
        const response = await apiClient.get<MessageCountInfo>('/api/messages/unread-count');
        return response.data;
      } catch (error) {
        return { unreadCount: 0 };
      }
    },
    initialData: { unreadCount: 0 },
    refetchInterval: shouldFetchMessages ? 30000 : false, // Only refetch if enabled
    staleTime: 15000, // Data stays fresh for 15 seconds
    refetchOnWindowFocus: false,
    enabled: shouldFetchMessages,
    retry: false, // Don't retry on 401 errors
  });

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) return null;

  return (
    <nav className="mobile-nav md:hidden sm:hidden">
      <div className="mobile-nav-backdrop"></div>

      <NavItem href="/" isActive={isActive("/")} icon={Home} />
      <NavItem href="/search" isActive={isActive("/search")} icon={Search} />
      <NavItem href="/competitions" isActive={isActive("/competitions")} icon={Trophy} />
      <NavItem 
        href="/messages" 
        isActive={isActive("/messages")} 
        icon={Mail} 
        badge={isLoggedIn ? messageData.unreadCount : undefined}
      />

      {notificationsEnabled && isLoggedIn && (
        <NavItem 
          href="/notifications" 
          isActive={isActive("/notifications")} 
          icon={Bell} 
          badge={notificationData.unreadCount}
        />
      )}

      {/* Profile */}
      {isLoggedIn && user ? (
        <Link 
          href={`/users/${user.username}`} 
          prefetch={true}
          className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200"
        >
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
        <Link 
          href="/login/google" 
          prefetch={true}
          className="flex-1 flex items-center justify-center py-2 active:opacity-70 transition-opacity duration-200"
        >
          <User className="h-6 w-6 text-foreground" />
        </Link>
      )}
    </nav>
  );
}
