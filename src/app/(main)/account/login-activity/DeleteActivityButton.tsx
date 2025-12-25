"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

import debug from "@/lib/debug";

interface DeleteActivityButtonProps {
  activityId: string;
}

export default function DeleteActivityButton({ activityId }: DeleteActivityButtonProps) {
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
    <div className="absolute top-3 right-3 z-10">
      <Button
        onClick={handleDelete}
        disabled={isLoading}
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-full border-red-300 bg-white hover:bg-red-50 hover:text-red-600 shadow-sm opacity-70 group-hover:opacity-100 transition-all dark:bg-gray-800 dark:border-red-500 dark:hover:bg-gray-700 dark:text-red-400 dark:hover:text-red-300"
        title="Delete this login activity"
        data-activity-id={activityId}
      >
        {isLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></span>
        ) : (
          <X className="h-4 w-4 stroke-2" />
        )}
      </Button>
    </div>
  );
}
