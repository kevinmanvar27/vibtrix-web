"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface RoundSelectorProps {
  rounds: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }[];
  currentRoundId?: string;
  isCompetitionTerminated?: boolean;
  completionReason?: string;
}

export default function RoundSelector({ rounds, currentRoundId, isCompetitionTerminated, completionReason }: RoundSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the currently selected round from the URL
  // If there's only one round and no round is selected, automatically select that round
  const selectedRoundId = searchParams.get("round") || (rounds.length === 1 ? rounds[0].id : "");

  // If there's only one round and no round is selected in the URL, update the URL
  // This effect runs once when the component mounts
  React.useEffect(() => {
    if (rounds.length === 1 && !searchParams.has("round")) {
      const params = new URLSearchParams(searchParams);
      params.set("round", rounds[0].id);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [rounds, searchParams, pathname, router]);

  // Handle round selection
  const handleRoundSelect = (roundId: string) => {
    // For terminated competitions, don't allow navigation to future rounds
    if (isCompetitionTerminated) {
      const round = rounds.find(r => r.id === roundId);
      if (round && new Date(round.startDate) > new Date()) {
        // Don't navigate to future rounds in terminated competitions
        return;
      }
    }

    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams);

    if (roundId) {
      // Set the round parameter
      params.set("round", roundId);
    } else {
      // Remove the round parameter if "All Rounds" is selected
      params.delete("round");
    }

    // Update the URL with the new search parameters
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Only show the "All" button if there's more than one round */}
      {rounds.length > 1 && (
        <Button
          variant={!selectedRoundId ? "default" : "outline"}
          size="sm"
          onClick={() => handleRoundSelect("")}
          title="View posts from all rounds"
        >
          All
        </Button>
      )}

      {rounds.map((round) => {
        const isActive = round.id === selectedRoundId;
        const isCurrent = round.id === currentRoundId;
        const hasStarted = new Date(round.startDate) <= new Date();
        const hasEnded = new Date(round.endDate) < new Date();

        // For terminated competitions, only enable rounds that had started
        let isEnabled = hasStarted || hasEnded;
        let buttonTitle = "";
        let isReadOnly = false;

        if (isCompetitionTerminated) {
          if (!hasStarted) {
            // Future rounds in terminated competitions are completely disabled
            isEnabled = false;
            isReadOnly = false; // Not read-only, just disabled
            buttonTitle = `${round.name} - Competition ended before this round started`;
          } else {
            // Past rounds in terminated competitions are read-only but clickable
            isEnabled = true;
            isReadOnly = true;
            buttonTitle = `${round.name} - Read only (Competition terminated)`;
          }
        } else {
          // Normal competition logic
          isEnabled = hasStarted || hasEnded;
          if (!hasStarted) {
            buttonTitle = `${round.name} will start on ${format(new Date(round.startDate), "MMM d, yyyy")}`;
          }
        }

        return (
          <Button
            key={round.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={`${isCurrent ? "border-green-500 dark:border-green-700" : ""} ${!isEnabled ? "opacity-60 cursor-not-allowed" : ""} ${isReadOnly && isEnabled ? "opacity-80" : ""}`}
            onClick={() => isEnabled ? handleRoundSelect(round.id) : undefined}
            title={buttonTitle}
            disabled={!isEnabled}
          >
            {round.name}
            {isCurrent && <span className="ml-1 text-xs text-green-500">•</span>}
            {!hasStarted && !isCompetitionTerminated && <span className="ml-1 text-xs text-blue-500">⏱️</span>}
            {hasEnded && !isCurrent && <span className="ml-1 text-xs text-gray-500">✓</span>}
          </Button>
        );
      })}
    </div>
  );
}
