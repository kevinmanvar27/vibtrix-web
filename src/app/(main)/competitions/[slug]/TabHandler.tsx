"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface TabHandlerProps {
  defaultTab: string;
}

export default function TabHandler({ defaultTab }: TabHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if the tab parameter is missing
    if (!searchParams.has("tab")) {
      // Create a new URLSearchParams object
      const params = new URLSearchParams(searchParams);
      
      // Set the default tab
      params.set("tab", defaultTab);
      
      // Update the URL with the new search parameters
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router, defaultTab]);
  
  // This component doesn't render anything
  return null;
}
