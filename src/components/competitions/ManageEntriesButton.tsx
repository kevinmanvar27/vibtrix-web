"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateCompetitionFeedQueries } from "@/lib/query-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Settings } from "lucide-react";

import debug from "@/lib/debug";

interface ManageEntriesButtonProps extends Omit<ButtonProps, "onClick"> {
  competitionId: string;
  onSuccess?: () => void;
}

export default function ManageEntriesButton({
  competitionId,
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
  ...props
}: ManageEntriesButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAction = async (selectedAction: string) => {
    if (isLoading) return;

    setAction(selectedAction);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/competitions/${competitionId}/manage-entries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: selectedAction }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to manage entries");
      }

      const data = await response.json();

      // Show success toast
      toast({
        title: "Success",
        description: data.message || "Entries managed successfully",
      });

      // Invalidate queries to refresh data
      invalidateCompetitionFeedQueries(queryClient, competitionId);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      debug.error("Error managing entries:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case "sync-entries":
        return "Sync Entries";
      case "fix-all-entries":
        return "Fix All Entries";
      case "fix-feed-visibility":
        return "Fix Feed Visibility";
      case "fix-feed-visibility-v2":
        return "Fix Feed Visibility V2";
      case "rebuild-entries":
        return "Rebuild Entries";
      default:
        return action;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
          {...props}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {action ? `Running ${getActionLabel(action)}...` : "Processing..."}
            </>
          ) : (
            <>
              <Settings className="mr-2 h-4 w-4" />
              Manage Entries
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Entry Management</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction("sync-entries")}>
          Sync Entries
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("fix-all-entries")}>
          Fix All Entries
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("rebuild-entries")}>
          Rebuild Entries
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Feed Visibility</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleAction("fix-feed-visibility")}>
          Fix Feed Visibility
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("fix-feed-visibility-v2")}>
          Fix Feed Visibility V2
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
