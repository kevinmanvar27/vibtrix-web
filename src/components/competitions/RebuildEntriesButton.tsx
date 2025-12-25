"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { Wrench } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import debug from "@/lib/debug";

interface RebuildEntriesButtonProps {
  competitionId: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onSuccess?: () => void;
}

export default function RebuildEntriesButton({
  competitionId,
  variant = "outline",
  size = "sm",
  className = "",
  onSuccess,
}: RebuildEntriesButtonProps) {
  const [isRebuilding, setIsRebuilding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRebuild = async () => {
    if (isRebuilding) return;

    if (!confirm("This will rebuild all competition entries. This action is designed to fix issues where entries disappear after competition updates. Continue?")) {
      return;
    }

    setIsRebuilding(true);
    try {
      const response = await apiClient.post(`/api/competitions/${competitionId}/rebuild-entries`);
      
      // Invalidate all competition-related queries
      queryClient.invalidateQueries({ queryKey: ["competition-feed"] });
      
      toast({
        title: "Entries rebuilt successfully",
        description: `All competition entries have been rebuilt. ${response.data?.results?.length || 0} entries processed.`,
      });

      // Force reload the page to ensure all data is refreshed
      window.location.reload();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      debug.error("Error rebuilding entries:", error);
      toast({
        variant: "destructive",
        title: "Rebuild failed",
        description: error instanceof Error ? error.message : "Failed to rebuild competition entries",
      });
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRebuild}
      disabled={isRebuilding}
      className={className}
    >
      <Wrench className={`h-4 w-4 ${isRebuilding ? "animate-spin" : "mr-2"}`} />
      {!isRebuilding ? "Fix Entries" : "Fixing..."}
    </Button>
  );
}
