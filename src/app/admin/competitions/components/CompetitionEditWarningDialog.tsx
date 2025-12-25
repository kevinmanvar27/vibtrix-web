"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface CompetitionEditWarningDialogProps {
  isOpen: boolean;
  competitionStatus: "Active" | "Completed";
  competitionId: string;
  onClose: () => void;
  onContinue: () => void;
}

export default function CompetitionEditWarningDialog({
  isOpen,
  competitionStatus,
  competitionId,
  onClose,
  onContinue,
}: CompetitionEditWarningDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Sync the open state with the isOpen prop
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  // Handle continue editing button click
  const handleContinue = () => {
    setOpen(false);
    onContinue();
  };

  // Handle view details button click
  const handleViewDetails = () => {
    router.push(`/admin/competitions/${competitionId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Competition {competitionStatus}</DialogTitle>
          </div>
          <DialogDescription>
            {competitionStatus === "Active" ? (
              "This competition has already started. You can still edit general competition details and add new rounds, but you cannot modify rounds that have already started."
            ) : (
              "This competition has been completed. You can still edit general competition details, but you cannot modify rounds that have already completed."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Any rounds that have already started or completed will be shown in read-only mode and cannot be modified.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose}>
            Go Back
          </Button>
          <Button variant="default" onClick={handleContinue}>
            Continue Editing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
