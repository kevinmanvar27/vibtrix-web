"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

import debug from "@/lib/debug";

interface MobileDeleteButtonProps {
  activityId: string;
}

export default function MobileDeleteButton({ activityId }: MobileDeleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    // Confirm before deleting
    if (!confirm("Are you sure you want to delete this login activity record?")) {
      return;
    }
    
    setIsLoading(true);
    try {
      debug.log('Calling API to delete login activity:', activityId);
      const response = await fetch('/api/login-activity/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId }),
      });
      
      const result = await response.json();
      debug.log('API response:', result);
      
      if (response.ok && result.success) {
        toast({
          title: "Login activity deleted",
          description: result.message || "The login activity record has been deleted.",
          variant: "default",
        });
        // Reload the page to show the updated list
        window.location.reload();
      } else {
        debug.error('API returned error:', result);
        toast({
          title: "Error",
          description: result.details ? `${result.error}: ${result.details}` : (result.error || "Failed to delete login activity"),
          variant: "destructive",
        });
      }
    } catch (error) {
      debug.error("Error deleting login activity:", error);
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
      variant="ghost"
      size="sm"
      className="text-red-500 text-xs hover:text-red-600 hover:bg-red-50 w-full"
      onClick={handleDelete}
      disabled={isLoading}
    >
      {isLoading ? "Deleting..." : "Delete this login record"}
    </Button>
  );
}
