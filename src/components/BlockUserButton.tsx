"use client";

import { Ban } from "lucide-react";
import { Button } from "./ui/button";
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
import { useToast } from "./ui/use-toast";
import apiClient from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFeatureSettings } from "@/hooks/use-feature-settings";

import debug from "@/lib/debug";

interface BlockUserButtonProps {
  userId: string;
  username: string;
  onSuccess?: () => void;
}

export default function BlockUserButton({
  userId,
  username,
  onSuccess,
}: BlockUserButtonProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userBlockingEnabled } = useFeatureSettings();

  const blockMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/users/${userId}/block`);
    },
    onSuccess: () => {
      setOpen(false);
      toast({
        title: "User blocked",
        description: `You have blocked @${username}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["follower-info", userId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["search"] });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate away from the user's profile if no callback is provided
        router.push("/");
      }
    },
    onError: (error) => {
      debug.error("Error blocking user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block user. Please try again.",
      });
    },
  });

  if (!userBlockingEnabled) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-3 text-destructive cursor-pointer w-full text-left">
          <Ban className="h-4 w-4" />
          Block
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block @{username}?</DialogTitle>
          <DialogDescription>
            When you block someone:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>They won't be able to find your profile</li>
              <li>They won't be able to message you</li>
              <li>They won't appear in your search results</li>
              <li>Existing messages will be hidden</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => blockMutation.mutate()}
            disabled={blockMutation.isPending}
          >
            {blockMutation.isPending ? "Blocking..." : "Block User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
