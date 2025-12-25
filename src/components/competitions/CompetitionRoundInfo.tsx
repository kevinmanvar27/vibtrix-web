"use client";

import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { Calendar, ThumbsUp, Clock, CheckCircle2, Timer } from "lucide-react";

interface CompetitionRoundInfoProps {
  round: {
    id: string;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    likesToPass: number | null;
  };
  isCurrentRound: boolean;
  hasSubmittedEntry?: boolean;
}

export function CompetitionRoundInfo({ round, isCurrentRound, hasSubmittedEntry }: CompetitionRoundInfoProps) {
  const startDate = new Date(round.startDate);
  const endDate = new Date(round.endDate);
  const currentDate = new Date();

  let status = "Upcoming";
  if (startDate <= currentDate) {
    if (endDate < currentDate) {
      status = "Completed";
    } else {
      status = "Active";
    }
  }

  // Calculate time remaining or time passed
  const getTimeInfo = () => {
    if (status === "Active") {
      const daysLeft = differenceInDays(endDate, currentDate);
      const hoursLeft = differenceInHours(endDate, currentDate) % 24;

      if (daysLeft > 0) {
        return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
      } else if (hoursLeft > 0) {
        return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
      } else {
        return "Ending soon";
      }
    } else if (status === "Upcoming") {
      const daysToStart = differenceInDays(startDate, currentDate);

      if (daysToStart > 0) {
        return `Starts in ${daysToStart} day${daysToStart !== 1 ? 's' : ''}`;
      } else {
        const hoursToStart = differenceInHours(startDate, currentDate);
        return `Starts in ${hoursToStart} hour${hoursToStart !== 1 ? 's' : ''}`;
      }
    }

    return "Completed";
  };

  // Get background color based on status
  const getBgColor = () => {
    if (isCurrentRound) return "bg-primary/5 border-primary";
    if (status === "Active") return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800";
    if (status === "Upcoming") return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800";
    return "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800";
  };

  return (
    <div className={`p-5 rounded-lg border ${getBgColor()} transition-all`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg flex items-center gap-2">
            {isCurrentRound && <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
            {round.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            {status === "Active" && <Timer className="h-3 w-3 text-green-500" />}
            {status === "Upcoming" && <Clock className="h-3 w-3 text-blue-500" />}
            {status === "Completed" && <CheckCircle2 className="h-3 w-3 text-gray-500" />}
            {getTimeInfo()}
          </p>
        </div>
        <Badge variant={
          status === "Active" ? "default" :
            status === "Upcoming" ? "secondary" :
              "outline"
        } className={
          status === "Active" ? "bg-green-500" : ""
        }>
          {status}
        </Badge>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 p-2 rounded bg-background/80">
          <Calendar className="h-4 w-4 text-blue-500" />
          <div className="flex flex-col">
            <span className="font-medium">Duration</span>
            <span className="text-muted-foreground">
              {format(startDate, "MMM d, yyyy h:mm a")} - {format(endDate, "MMM d, yyyy h:mm a")}
            </span>
          </div>
        </div>

        {round.likesToPass && (
          <div className="flex items-center gap-2 p-2 rounded bg-background/80">
            <ThumbsUp className="h-4 w-4 text-pink-500" />
            <div className="flex flex-col">
              <span className="font-medium">Qualification</span>
              <span className="text-muted-foreground">Minimum {round.likesToPass} likes to advance</span>
            </div>
          </div>
        )}

        {/* Entry Status Indicator */}
        <div className="flex items-center gap-2 p-2 rounded bg-background/80">
          {hasSubmittedEntry ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="font-medium">Entry Status</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Post Submitted</span>
              </div>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="flex flex-col">
                <span className="font-medium">Entry Status</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">No Post Submitted</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
