"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import feed components with no SSR to improve performance
const ForYouFeed = dynamic(() => import("./ForYouFeed"), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-muted/10 animate-pulse rounded-md"></div>,
});

const FollowingFeed = dynamic(() => import("./FollowingFeed"), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-muted/10 animate-pulse rounded-md"></div>,
});

export default function HomeTabs() {
  // Use local state to manage the active tab
  const [activeTab, setActiveTab] = useState("for-you");

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="for-you">For you</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
      </TabsList>
      <TabsContent value="for-you">
        {activeTab === "for-you" && <ForYouFeed />}
      </TabsContent>
      <TabsContent value="following">
        {activeTab === "following" && <FollowingFeed />}
      </TabsContent>
    </Tabs>
  );
}
