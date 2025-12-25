"use client";

import { Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";

interface BlockedUserUnblockButtonProps {
  userId: string;
  username: string;
  onUnblock: (userId: string) => void;
}

export default function BlockedUserUnblockButton({
  userId,
  username,
  onUnblock,
}: BlockedUserUnblockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUnblock = async () => {
    if (confirm(`Are you sure you want to unblock @${username}?`)) {
      setIsLoading(true);
      try {
        await apiClient.delete(`/api/users/${userId}/block`);
        toast({
          title: "User unblocked",
          description: `You have unblocked @${username}`,
        });
        onUnblock(userId);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to unblock user. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnblock}
      disabled={isLoading}
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/30 dark:border-orange-900/50"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Unblocking...
        </>
      ) : (
        <>
          <Unlock className="mr-2 h-4 w-4" />
          Unblock
        </>
      )}
    </Button>
  );
}
