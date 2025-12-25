"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/LoadingButton";

interface DeleteEntryDialogProps {
  open: boolean;
  onClose: () => void;
  competitionId: string;
  roundId: string;
  roundName: string;
  onDeleted: () => void;
}

export default function DeleteEntryDialog({
  open,
  onClose,
  competitionId,
  roundId,
  roundName,
  onDeleted
}: DeleteEntryDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/competitions/${competitionId}/delete-entry`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roundId: roundId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete entry");
      }

      toast({
        title: "Success!",
        description: `Your entry for round: ${roundName} has been deleted`,
      });

      router.refresh();
      onDeleted();
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete entry",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Competition Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your entry for round: {roundName}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            If you delete this entry, you can upload a new one as long as the round hasn't started yet.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <LoadingButton
            variant="destructive"
            onClick={handleDelete}
            loading={isDeleting}
          >
            Delete Entry
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
