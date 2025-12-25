"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wrench } from "lucide-react";
import { useState } from "react";
import debug from "@/lib/debug";

interface FixAllEntriesButtonProps extends ButtonProps {
  competitionId: string;
  onSuccess?: () => void;
}

export default function FixAllEntriesButton({
  competitionId,
  onSuccess,
  children,
  ...props
}: FixAllEntriesButtonProps) {
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleFix = async () => {
    if (isFixing) return;

    setIsFixing(true);
    setResults(null);

    try {
      const response = await apiClient.post(`/api/competitions/${competitionId}/manage-entries`, { action: "fix-all-entries" });

      // Invalidate all competition-related queries
      queryClient.invalidateQueries({ queryKey: ["competition-feed"] });

      setResults(response.data);

      toast({
        title: "Entries fixed successfully",
        description: `All competition entries have been fixed. ${response.data?.entriesFixed || 0} entries processed.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      debug.error("Error fixing entries:", error);
      toast({
        variant: "destructive",
        title: "Fix operation failed",
        description: error instanceof Error ? error.message : "Failed to fix competition entries",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      onClick={handleFix}
      disabled={isFixing}
      {...props}
    >
      {isFixing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Fixing Entries...
        </>
      ) : children || (
        <>
          <Wrench className="h-4 w-4 mr-2" />
          Fix All Entries
        </>
      )}
    </Button>
  );
}
