"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Settings,
  Trophy,
  Users,
  Video,
  CreditCard,
  Home,
  UserCog,
  Bell,
  LogOut,
  Shield,
  MonitorPlay,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Sliders,
  Camera,
  Briefcase,
} from "lucide-react";
import { User } from "lucia";
import { useState } from "react";
import debug from "@/lib/debug";


// Define menu items with role-based access control
const navItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"], // All admin roles can access
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["ADMIN", "SUPER_ADMIN"], // Only ADMIN and SUPER_ADMIN can access
  },
  {
    name: "Management Users",
    href: "/admin/management-users",
    icon: Shield,
    roles: ["SUPER_ADMIN"], // Only SUPER_ADMIN can access
  },
  {
    name: "Roles",
    href: "/admin/roles",
    icon: Shield,
    roles: ["SUPER_ADMIN"], // Only SUPER_ADMIN can access
  },

  {
    name: "Posts",
    href: "/admin/posts",
    icon: Video,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  },
  {
    name: "Competitions",
    href: "/admin/competitions",
    icon: Trophy,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  },

  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Pages",
    href: "/admin/pages",
    icon: FileText,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  },
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  },
  {
    name: "Advertisements",
    href: "#", // Use a placeholder href for parent items with submenu
    icon: MonitorPlay,
    roles: ["ADMIN", "SUPER_ADMIN"],
    submenu: [
      {
        name: "All Advertisements",
        href: "/admin/advertisements/list",
        icon: ListFilter,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        name: "Feed Settings",
        href: "/admin/advertisements/feed-settings",
        icon: Sliders,
        roles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
  },
  {
    name: "Modeling",
    href: "/admin/modeling",
    icon: Camera,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Brand Ambassadorship",
    href: "/admin/brand-ambassadorship",
    icon: Briefcase,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },

  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN"], // Only SUPER_ADMIN can access settings
  },

  {
    name: "Admin Profile",
    href: "/admin/profile",
    icon: UserCog,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  },
  {
    name: "Back to Site",
    href: "/",
    icon: Home,
    roles: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
  },
];

interface AdminSidebarProps {
  user: User | null;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Debug the component rendering
  debug.log("AdminSidebar rendering with user:", user?.id);

  // If no user or user doesn't have a role, don't render the sidebar
  if (!user || !user.role) {
    debug.warn("AdminSidebar: No user or role found");
    return null;
  }

  // Filter menu items based on user role
  const filteredNavItems = navItems.filter(item => {
    // Check if user has the required role
    return item.roles.includes(user.role as string);
  });

  // Toggle submenu
  const toggleSubmenu = (name: string) => {
    debug.log("Toggling submenu:", name);
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  return (
    <div className="w-64 bg-card shadow-md min-h-screen p-4 flex flex-col">
      <div className="mb-8 p-2">
        <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.displayName}</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            // Check if this item has a submenu
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            // For items with submenu, check if any submenu item is active
            const isSubmenuActive = hasSubmenu && item.submenu.some(subItem =>
              pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
            );

            // For items with submenu, parent is never directly active
            // For items without submenu, check if the current path matches
            // Ignore parent items with placeholder href "#"
            const isActive = hasSubmenu || item.href === "#"
              ? false
              : pathname === item.href ||
                (pathname.startsWith(`${item.href}/`) && item.href !== "/") ||
                // Special case for static pages with query parameters
                (item.href.includes('?slug=') && pathname.startsWith('/admin/pages/') &&
                 item.href.includes(new URLSearchParams(pathname.split('?')[1] || '').get('slug') || ''));

            // Auto-open submenu if any of its items are active
            if (isSubmenuActive && openSubmenu !== item.name) {
              setOpenSubmenu(item.name);
            }

            return (
              <li key={item.href + item.name}>
                {hasSubmenu ? (
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSubmenu(item.name);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors",
                        isSubmenuActive
                          ? "bg-primary/20 text-primary font-medium" // Highlight but not as active
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      {openSubmenu === item.name ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {openSubmenu === item.name && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-primary/20 pl-3">
                        {item.submenu.map((subItem) => {
                          // Simple exact path matching for submenu items
                          const isSubItemActive = pathname === subItem.href;

                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                                  isSubItemActive
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span className="text-sm">{subItem.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t">
        <Link
          href="/admin/logout"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
}
