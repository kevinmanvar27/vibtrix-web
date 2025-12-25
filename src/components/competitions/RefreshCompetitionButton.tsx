"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import debug from "@/lib/debug";

interface RefreshCompetitionButtonProps {
  competitionId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function RefreshCompetitionButton({
  competitionId,
  variant = "outline",
  size = "sm",
  className = "",
}: RefreshCompetitionButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await apiClient.post(`/api/competitions/${competitionId}/refresh`);
      
      // Invalidate all competition-related queries
      queryClient.invalidateQueries({ queryKey: ["competition-feed"] });
      
      toast({
        title: "Competition refreshed",
        description: "All competition data has been refreshed.",
      });
    } catch (error) {
      debug.error("Error refreshing competition:", error);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Failed to refresh competition data",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={className}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : "mr-2"}`} />
      {!isRefreshing ? "Refresh" : "Refreshing..."}
    </Button>
  );
}
