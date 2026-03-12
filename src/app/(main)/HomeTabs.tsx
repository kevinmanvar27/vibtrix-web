"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";

// Memoize the feed components to prevent unnecessary re-renders
const ForYouFeedComponent = memo(dynamic(() => import("./ForYouFeed"), {
  ssr: false,
  loading: () => <div className="w-full min-h-64 bg-muted/10 animate-pulse rounded-md flex items-center justify-center">
    <span className="text-muted-foreground">Loading feed...</span>
  </div>,
}));

const FollowingFeedComponent = memo(dynamic(() => import("./FollowingFeed"), {
  ssr: false,
  loading: () => <div className="w-full min-h-64 bg-muted/10 animate-pulse rounded-md flex items-center justify-center">
    <span className="text-muted-foreground">Loading feed...</span>
  </div>,
}));

export default function HomeTabs() {
  // Use local state to manage the active tab
  const [activeTab, setActiveTab] = useState("for-you");

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full max-w-md mx-auto">
        <TabsTrigger value="for-you" className="flex-1">For you</TabsTrigger>
        <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
      </TabsList>
      <TabsContent value="for-you" className="mt-4">
        {activeTab === "for-you" && <ForYouFeedComponent />}
      </TabsContent>
      <TabsContent value="following" className="mt-4">
        {activeTab === "following" && <FollowingFeedComponent />}
      </TabsContent>
    </Tabs>
  );
}
