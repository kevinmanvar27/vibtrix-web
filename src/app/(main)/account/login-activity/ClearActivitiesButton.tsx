"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

import debug from "@/lib/debug";

export default function ClearActivitiesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClearActivities = async () => {
    // Confirm before clearing
    if (!confirm("Are you sure you want to clear all your login activity history?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      debug.log('Calling API to clear login activities');
      const response = await fetch('/api/login-activity/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      debug.log('API response:', result);
      
      if (response.ok && result.success) {
        toast({
          title: "Login activities cleared",
          description: result.message || `All login activities have been cleared.`,
          variant: "default",
        });
        // Reload the page to show the updated list
        window.location.reload();
      } else {
        debug.error('API returned error:', result);
        toast({
          title: "Error",
          description: result.details ? `${result.error}: ${result.details}` : (result.error || "Failed to clear login activities"),
          variant: "destructive",
        });
      }
    } catch (error) {
      debug.error("Error clearing login activities:", error);
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        debug.error("Error details:", error.stack);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClearActivities} 
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="ml-2 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isLoading ? "Clearing..." : "Clear All"}
    </Button>
  );
}
