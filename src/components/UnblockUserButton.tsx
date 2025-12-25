"use client";

import { Ban, Loader2, Unlock } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import apiClient from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useState } from "react";
import { useFeatureSettings } from "@/hooks/use-feature-settings";

import debug from "@/lib/debug";

interface UnblockUserButtonProps {
  userId: string;
  username: string;
  onSuccess?: () => void;
}

export default function UnblockUserButton({
  userId,
  username,
  onSuccess,
}: UnblockUserButtonProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userBlockingEnabled } = useFeatureSettings();

  const unblockMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/users/${userId}/block`);
    },
    onSuccess: () => {
      setOpen(false);
      toast({
        title: "User unblocked",
        description: `You have unblocked @${username}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      debug.error("Error unblocking user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock user. Please try again.",
      });
    },
  });

  if (!userBlockingEnabled) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/30 dark:border-orange-900/50"
        >
          <Unlock className="mr-2 h-4 w-4" />
          Unblock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unblock @{username}?</DialogTitle>
          <DialogDescription>
            When you unblock someone:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>They will be able to find your profile again</li>
              <li>They will be able to message you</li>
              <li>They will appear in your search results</li>
              <li>Previous messages will become visible again</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => unblockMutation.mutate()}
            disabled={unblockMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {unblockMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unblocking...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unblock User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
