"use client";

import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import debug from "@/lib/debug";

interface SyncRoundEntriesButtonProps {
  competitionId: string;
}

export default function SyncRoundEntriesButton({ competitionId }: SyncRoundEntriesButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.post(`/api/competitions/${competitionId}/sync-round-entries`);

      toast({
        title: "Success",
        description: `${(response.data as any)?.message || 'Round entries synced successfully'}`,
        variant: "default",
      });
    } catch (error) {
      debug.error("Error syncing round entries:", error);

      toast({
        title: "Error",
        description: "Failed to synchronize round entries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        "Sync Round Entries"
      )}
    </Button>
  );
}
