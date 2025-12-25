"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import CompetitionForm from "../../components/CompetitionForm";
import PromotionStickersSection from "../components/PromotionStickersSection";
import CompetitionEditWarningDialog from "../../components/CompetitionEditWarningDialog";
import FixCompetitionEntriesButton from "@/components/competitions/FixCompetitionEntriesButton";
import DebugCompetitionEntriesButton from "@/components/competitions/DebugCompetitionEntriesButton";

interface EditCompetitionClientProps {
  competition: any;
  competitionStatus: "Upcoming" | "Active" | "Completed";
  startedRoundIds: string[];
}

export default function EditCompetitionClient({
  competition,
  competitionStatus,
  startedRoundIds
}: EditCompetitionClientProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Check if competition has started or completed when component mounts
  useEffect(() => {
    if ((competitionStatus === "Active" || competitionStatus === "Completed") && !acknowledged) {
      setShowWarning(true);
    }
  }, [competitionStatus, acknowledged]);

  // Handle continue editing after warning
  const handleContinueEditing = () => {
    setAcknowledged(true);
    setShowWarning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Competition</h1>
        <p className="text-muted-foreground">
          Update competition details and settings.
        </p>
      </div>

      {/* Warning Dialog */}
      {(competitionStatus === "Active" || competitionStatus === "Completed") && (
        <CompetitionEditWarningDialog
          isOpen={showWarning}
          competitionStatus={competitionStatus as "Active" | "Completed"}
          competitionId={competition.id}
          onClose={() => setShowWarning(false)}
          onContinue={handleContinueEditing}
        />
      )}

      {/* Show warning banner if competition has started rounds */}
      {(competitionStatus === "Active" || competitionStatus === "Completed") && acknowledged && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-md p-3 text-sm text-amber-700 dark:text-amber-400">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {competitionStatus === "Active"
              ? "Some rounds have already started and cannot be modified. You can still edit general competition details and add new rounds."
              : "This competition has completed. You can still edit general details, but rounds cannot be modified."}
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Competition Details</CardTitle>
          <div className="flex gap-2">
            <FixCompetitionEntriesButton competitionId={competition.id} />
            <DebugCompetitionEntriesButton competitionId={competition.id} />
          </div>
        </CardHeader>
        <CardContent>
          <CompetitionForm
            competition={competition}
            startedRoundIds={startedRoundIds}
          />
        </CardContent>
      </Card>

      {/* Promotion Stickers Section */}
      <PromotionStickersSection competitionId={competition.id} />
    </div>
  );
}
