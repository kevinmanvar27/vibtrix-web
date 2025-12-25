"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Upload, Clock, CheckCircle2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadPostModal from "./UploadPostModal";
import RoundPostPreview from "./RoundPostPreview";
import { useSearchParams } from "next/navigation";

interface RoundUploadCardProps {
  round: {
    id: string;
    name: string;
    startDate: string | Date;
    endDate: string | Date;
    likesToPass: number | null;
  };
  competitionId: string;
  mediaType: 'IMAGE_ONLY' | 'VIDEO_ONLY' | 'BOTH';
  maxDuration?: number;
  roundStarted: boolean;
  roundEnded: boolean;
  isCompetitionCompleted?: boolean;
  existingPost?: {
    id: string;
    content: string;
    attachments: Array<{
      id: string;
      url: string;
      type: 'IMAGE' | 'VIDEO';
    }>;
  };
}

export default function RoundUploadCard({
  round,
  competitionId,
  mediaType,
  maxDuration,
  roundStarted,
  roundEnded,
  isCompetitionCompleted = false,
  existingPost
}: RoundUploadCardProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const searchParams = useSearchParams();

  // Use a ref to track if we've already opened the modal based on URL parameters
  const modalOpenedFromUrlRef = useRef(false);

  // We've removed the automatic modal opening based on URL parameters
  // Now the modal will only open when the user explicitly clicks the "View" or "Upload Entry" button

  // Get status information
  let statusText = "";
  let statusIcon = null;

  if (roundStarted && !roundEnded) {
    statusText = "Active";
    statusIcon = <Timer className="h-3.5 w-3.5" />;
  } else if (!roundStarted) {
    statusText = "Upcoming";
    statusIcon = <Clock className="h-3.5 w-3.5" />;
  } else {
    statusText = "Completed";
    statusIcon = <CheckCircle2 className="h-3.5 w-3.5" />;
  }

  // Get background color based on status
  const getHeaderBgClass = () => {
    if (roundStarted && !roundEnded) return "bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20";
    if (!roundStarted) return "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20";
    return "bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-950/30 dark:to-gray-900/20";
  };

  const getIconBgClass = () => {
    if (roundStarted && !roundEnded) return "bg-primary/10 text-primary";
    if (!roundStarted) return "bg-primary/10 text-primary";
    return "bg-muted text-muted-foreground";
  };

  const getStatusBadgeClass = () => {
    if (roundStarted && !roundEnded) return "bg-green-500/90 text-white";
    if (!roundStarted) return "bg-blue-500/90 text-white";
    return "bg-gray-500/90 text-white";
  };

  return (
    <div id={`round-${round.id}`} className="group relative border border-border hover:border-primary/20 rounded-xl overflow-hidden bg-card hover:bg-card/80 transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Status indicator - absolute positioned ribbon */}
      <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full shadow-sm ${getStatusBadgeClass()}`}>
        {statusIcon}
        <span>{statusText}</span>
      </div>

      {/* Round header with gradient background */}
      <div className={`px-4 py-3 border-b border-border flex items-center gap-3 bg-card`}>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getIconBgClass()}`}>
          {roundStarted && !roundEnded ? (
            <Timer className="h-5 w-5" />
          ) : !roundStarted ? (
            <Clock className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">{round.name}</h3>
          <div className="flex items-center gap-2 text-xs text-foreground/80 mt-1">
            <span className="inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span className="font-medium">
                {roundStarted && !roundEnded ? (
                  <>Ends: {format(new Date(round.endDate), "MMM d, yyyy")}</>
                ) : !roundStarted ? (
                  <>Starts: {format(new Date(round.startDate), "MMM d, yyyy")}</>
                ) : (
                  <>Ended: {format(new Date(round.endDate), "MMM d, yyyy")}</>
                )}
              </span>
            </span>
            {round.likesToPass && (
              <span className="inline-flex items-center gap-1 border-l border-muted pl-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M7 10v12" />
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                </svg>
                <span className="font-medium">{round.likesToPass} likes to pass</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* We've removed the duplicate Submitted indicator */}

      <div className="p-5">
        {roundEnded && !existingPost ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-foreground bg-card rounded-lg border border-dashed border-border shadow-sm">
            <div className="bg-muted rounded-full p-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">This round has ended</p>
            <p className="text-xs mt-1 text-foreground/70">You did not submit an entry</p>
          </div>
        ) : existingPost ? (
          // Show post preview if there's an existing post
          <RoundPostPreview
            post={existingPost}
            competitionId={competitionId}
            roundId={round.id}
            roundName={round.name}
            roundStarted={roundStarted}
            roundEnded={roundEnded}
            onDeleted={() => {
              window.location.reload();
            }}
            onUploadClick={() => setIsUploadModalOpen(true)}
          />
        ) : (
          // Show upload button if no post exists yet
          <div className="flex flex-col items-center justify-center py-8 text-center bg-card rounded-lg border border-dashed border-primary/30 hover:border-primary/50 transition-colors shadow-sm">
            <div className="bg-primary/10 rounded-full p-4 mb-4 shadow-sm">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-lg mb-2 text-foreground">No Entry Yet</h3>
            <p className="text-sm text-foreground/80 mb-2 max-w-xs mx-auto">
              {!roundStarted
                ? "Upload your entry early! It will appear in the feed when the round starts."
                : roundEnded
                ? "This round has ended. Upload window is closed."
                : "This round is active! Submit your entry before it ends."}
            </p>
            <p className="text-xs text-foreground/70 mb-5 max-w-xs mx-auto font-medium border-t border-border/50 pt-2 mt-2">
              You can only submit one entry per round
            </p>
            {!isCompetitionCompleted && !roundEnded && (
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="shadow-sm px-5 py-2 h-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Entry
              </Button>
            )}
            {(isCompetitionCompleted || roundEnded) && (
              <div className="text-sm text-muted-foreground py-2">
                <p>{isCompetitionCompleted ? "Competition completed - Uploads closed" : "Round ended - Upload window closed"}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadPostModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        competitionId={competitionId}
        roundId={round.id}
        roundName={round.name}
        mediaType={mediaType}
        maxDuration={maxDuration}
        existingPost={existingPost}
        roundStarted={roundStarted}
        roundEnded={roundEnded}
        isCompetitionCompleted={isCompetitionCompleted}
      />
    </div>
  );
}
