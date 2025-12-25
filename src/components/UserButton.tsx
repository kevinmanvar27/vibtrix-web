"use client";

import { logout } from "@/app/(auth)/actions";
import { useSession } from "@/app/(main)/SessionProvider";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Ban, Check, Cog, LogInIcon, LogOutIcon, Medal, Monitor, Moon, Shield, Sun, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import UserAvatar from "./UserAvatar";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { useGuestSession } from "./GuestSessionProvider";
import { Button } from "./ui/button";

interface UserButtonProps {
  className?: string;
}

export default function UserButton({ className }: UserButtonProps) {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Get session information
  const { user, isLoggedIn } = useSession();

  // Get feature settings, with fallbacks if not available
  let loginActivityTrackingEnabled = false;
  try {
    const featureSettings = useFeatureSettings();
    loginActivityTrackingEnabled = featureSettings.loginActivityTrackingEnabled;
  } catch (error) {
    // Ignore if feature settings aren't available
  }

  // Get the guest session for redirecting
  const guestSession = useGuestSession();

  // If not logged in, set up redirect function
  const redirectToLogin = () => {
    if (!isLoggedIn) {
      guestSession.redirectToLogin('/login/google');
    }
  };

  // Guest user button
  if (!isLoggedIn) {
    return (
      <Button
        variant="outline"
        className={cn("flex items-center gap-2", className)}
        onClick={() => redirectToLogin()}
      >
        <LogInIcon className="size-4" />
        <span>Sign In</span>
      </Button>
    );
  }

  // Logged-in user dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("flex-none rounded-full", className)}>
          <UserAvatar avatarUrl={user.avatarUrl} size={40} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Logged in as @{user?.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={`/users/${user?.username}`}>
          <DropdownMenuItem>
            <UserIcon className="mr-2 size-4" />
            Profile
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem>
            <Cog className="mr-2 size-4" />
            Settings
          </DropdownMenuItem>
        </Link>
        {loginActivityTrackingEnabled && (
          <Link href="/account/login-activity">
            <DropdownMenuItem>
              <Activity className="mr-2 size-4" />
              Login Activity
            </DropdownMenuItem>
          </Link>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor className="mr-2 size-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 size-4" />
                System default
                {theme === "system" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 size-4" />
                Light
                {theme === "light" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 size-4" />
                Dark
                {theme === "dark" && <Check className="ms-2 size-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            queryClient.clear();
            logout();
          }}
        >
          <LogOutIcon className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
