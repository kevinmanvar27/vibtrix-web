"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";
import { useSession } from "@/app/(main)/SessionProvider";

interface TabsWithUrlSyncProps {
  defaultValue: string;
  children: ReactNode;
  isParticipant: boolean;
  status: string;
}

export default function TabsWithUrlSync({
  defaultValue,
  children,
  isParticipant,
  status,
}: TabsWithUrlSyncProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useSession();

  // Get the current tab from the URL or use the default
  const tab = searchParams.get("tab") || defaultValue;

  // Handle tab change
  const handleTabChange = (value: string) => {
    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams);

    // Set the tab parameter
    params.set("tab", value);

    // Update the URL with the new search parameters
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className={`grid w-full ${status === "Completed" ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <TabsTrigger value="details">Details</TabsTrigger>
        {status !== "Upcoming" && <TabsTrigger value="feed">Feed</TabsTrigger>}
        {status !== "Completed" && (
          <TabsTrigger value="upload">
            {isParticipant ? "My Entries" : isLoggedIn ? "Join" : "Sign In"}
          </TabsTrigger>
        )}
      </TabsList>
      {children}
    </Tabs>
  );
}
