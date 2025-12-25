"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Calendar, Clock, CheckCircle2, Timer, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoundPostPreview from "./RoundPostPreview";
import { useRouter } from "next/navigation";

interface EntryCardProps {
  entry: {
    id: string;
    competitionId: string;
    competitionTitle: string;
    roundId: string;
    roundName: string;
    startDate: string | Date;
    endDate: string | Date;
    post: {
      id: string;
      content: string;
      attachments: Array<{
        id: string;
        url: string;
        type: 'IMAGE' | 'VIDEO';
      }>;
    } | null;
  };
}

export default function EntryCard({ entry }: EntryCardProps) {
  const router = useRouter();

  // Get status information
  const startDate = new Date(entry.startDate);
  const endDate = new Date(entry.endDate);
  const currentDate = new Date();

  const roundStarted = startDate <= currentDate;
  const roundEnded = endDate < currentDate;

  let status = "";
  let statusIcon = null;
  let statusBadgeClass = "";

  if (roundStarted && !roundEnded) {
    status = "Active";
    statusIcon = <Timer className="h-3.5 w-3.5" />;
    statusBadgeClass = "bg-green-500/90 text-white";
  } else if (!roundStarted) {
    status = "Upcoming";
    statusIcon = <Clock className="h-3.5 w-3.5" />;
    statusBadgeClass = "bg-blue-500/90 text-white";
  } else {
    status = "Completed";
    statusIcon = <CheckCircle2 className="h-3.5 w-3.5" />;
    statusBadgeClass = "bg-gray-500/90 text-white";
  }

  // Check if entry has a post (submitted)
  const isSubmitted = !!entry.post;

  // Get the first attachment if available
  const firstAttachment = isSubmitted && entry.post?.attachments.length ?
    entry.post.attachments[0] : null;

  return (
    <div className="group relative border border-border hover:border-primary/20 rounded-xl overflow-hidden bg-card hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Status indicator - absolute positioned ribbon */}
      <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full shadow-sm ${statusBadgeClass}`}>
        {statusIcon}
        <span>{status}</span>
      </div>

      {/* Competition title */}
      <div className="px-4 py-3 border-b border-border bg-card">
        <Link href={`/competitions/${entry.competitionId}`} className="font-semibold hover:text-primary transition-colors text-foreground">
          {entry.competitionTitle}
        </Link>
        <p className="text-xs text-muted-foreground font-medium">
          {entry.roundName}
        </p>
      </div>

      {/* Entry content */}
      <div className="p-4">
        {isSubmitted && entry.post ? (
          <div className="space-y-3">
            {/* Use RoundPostPreview for submitted entries */}
            <RoundPostPreview
              post={entry.post}
              competitionId={entry.competitionId}
              roundId={entry.roundId}
              roundName={entry.roundName}
              roundStarted={roundStarted}
              onDeleted={() => {
                router.refresh();
              }}
              onUploadClick={() => {
                router.push(`/competitions/${entry.competitionId}?tab=upload&round=${entry.roundId}`);
              }}
            />

            {/* Date info */}
            <div className="flex items-center gap-2 text-xs text-foreground bg-muted/30 px-3 py-1.5 rounded-md">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">
                {roundStarted && !roundEnded ? (
                  <>Ends {format(endDate, "MMM d, yyyy")}</>
                ) : !roundStarted ? (
                  <>Starts {format(startDate, "MMM d, yyyy")}</>
                ) : (
                  <>Ended {format(endDate, "MMM d, yyyy")}</>
                )}
              </span>
            </div>

            {/* View competition link */}
            <div className="flex items-center justify-end">
              <Link href={`/competitions/${entry.competitionId}`} className="text-xs text-primary hover:underline">
                View Competition
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center bg-card border border-border/50 rounded-lg shadow-sm">
            <div className="bg-primary/10 rounded-full p-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 className="font-medium mb-1 text-foreground">No Entry Yet</h3>
            <p className="text-sm text-foreground/80 mb-4 max-w-xs mx-auto">
              {!roundStarted
                ? "Upload your entry before the round starts for the best chance to win!"
                : roundEnded
                  ? "This round has ended. You did not submit an entry."
                  : "This round is active! Submit your entry before it ends."}
            </p>
            <Link href={`/competitions/${entry.competitionId}?tab=upload&round=${entry.roundId}`}>
              <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Upload className="h-4 w-4 mr-1.5" />
                Upload Entry
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* We've removed the preview dialog since we're using RoundPostPreview */}
    </div>
  );
}
