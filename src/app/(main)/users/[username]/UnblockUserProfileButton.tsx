"use client";

import { Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface UnblockUserProfileButtonProps {
  userId: string;
  username: string;
}

export default function UnblockUserProfileButton({
  userId,
  username,
}: UnblockUserProfileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUnblock = async () => {
    if (confirm(`Are you sure you want to unblock @${username}?`)) {
      setIsLoading(true);
      try {
        await apiClient.delete(`/api/users/${userId}/block`);
        toast({
          title: "User unblocked",
          description: `You have unblocked @${username}`,
        });
        // Refresh the page after unblocking
        window.location.href = `/users/${username}`;
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
      variant="default"
      onClick={handleUnblock}
      disabled={isLoading}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Unblocking...
        </>
      ) : (
        <>
          <Unlock className="h-4 w-4" />
          Unblock User
        </>
      )}
    </Button>
  );
}
