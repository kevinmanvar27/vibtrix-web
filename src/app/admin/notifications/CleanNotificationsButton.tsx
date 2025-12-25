"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useState } from "react";

import debug from "@/lib/debug";

// Define the expected response type
interface CleanNotificationsResponse {
  cleaned: boolean;
  count: number;
}

export default function CleanNotificationsButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanedCount, setLastCleanedCount] = useState<number | null>(null);

  const handleCleanNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/api/admin/clean-notifications");
      const data = response.data as CleanNotificationsResponse;

      if (data.cleaned) {
        setLastCleanedCount(data.count);
        toast({
          title: "Notifications cleaned",
          description: `Successfully removed ${data.count} duplicate notifications.`,
        });
      } else {
        toast({
          title: "No duplicates found",
          description: "No duplicate notifications were found in the database.",
        });
      }
    } catch (error) {
      debug.error("Error cleaning notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clean notifications. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleCleanNotifications} 
        disabled={isLoading}
      >
        {isLoading ? "Cleaning..." : "Clean Duplicate Notifications"}
      </Button>
      
      {lastCleanedCount !== null && (
        <p className="text-sm text-muted-foreground">
          Last cleaned: {lastCleanedCount} duplicate notifications removed
        </p>
      )}
    </div>
  );
}