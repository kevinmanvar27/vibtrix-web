"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Loader2 } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import debug from "@/lib/debug";

interface Winner {
  position: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  postId: string;
  likes: number; // Competition-period likes
  totalLikes?: number; // Total likes (including after competition)
  mediaUrl: string | null;
  mediaType: string | null;
}

interface CompetitionWinnersProps {
  competitionId: string;
  isCompleted: boolean;
}

export function CompetitionWinners({ competitionId, isCompleted }: CompetitionWinnersProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionReason, setCompletionReason] = useState<string | null>(null);

  useEffect(() => {
    if (!isCompleted) {
      setLoading(false);
      return;
    }

    const fetchWinners = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state

        debug.log(`Fetching winners for competition: ${competitionId}`);
        const response = await apiClient.get(`/api/competitions/${competitionId}/winners`);

        debug.log("Winners API response:", response.data);

        // Check if this is a 400 response (competition not completed yet)
        if (response.status === 400) {
          debug.log("Competition not completed yet, no winners to show");
          setWinners([]);
          setError(null); // Don't show error for incomplete competitions
          return;
        }

        if (response.data.winners && Array.isArray(response.data.winners)) {
          setWinners(response.data.winners);
          debug.log(`Found ${response.data.winners.length} winners`);
        } else {
          setWinners([]);
          debug.log("No winners found in response");
        }

        // Check if there's a completion reason in the response
        if (response.data.completionReason) {
          setCompletionReason(response.data.completionReason);
          debug.log("Competition completion reason:", response.data.completionReason);
        }

        // Check if there's a noParticipants flag in the response
        if (response.data.noParticipants) {
          // No error, just no participants to show
          setWinners([]);
          debug.log("No participants in competition");
        }
      } catch (err: any) {
        debug.error("Error fetching winners:", err);

        // Check if it's a 400 error (competition not completed)
        if (err.status === 400 || err.message?.includes("Competition not completed yet")) {
          debug.log("Competition not completed yet, no winners to show");
          setWinners([]);
          setError(null); // Don't show error for incomplete competitions
          return;
        }

        // Check if it's a 404 error (competition not found)
        if (err.status === 404 || err.message?.includes("Competition not found")) {
          debug.log("Competition not found");
          setWinners([]);
          setError("Competition not found");
          return;
        }

        // Don't show error if it's a "no participants" situation
        if (err.details?.noParticipants || err.message?.includes("No participants")) {
          setWinners([]);
          // Check if there's a completion reason in the error response
          if (err.details?.completionReason) {
            setCompletionReason(err.details.completionReason);
          }
        } else {
          setError("Failed to load winners");
          debug.error("Setting error state:", "Failed to load winners");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [competitionId, isCompleted]);

  if (!isCompleted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (winners.length === 0) {
    // If we have a completion reason, display it
    if (completionReason) {
      // Special case for "No participants joined the competition"
      if (completionReason === "No participants joined the competition") {
        return (
          <div className="mb-8">
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Trophy className="h-5 w-5" />
                  <p className="font-medium">{completionReason}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // For other completion reasons, show with the "Competition Results" heading
      return (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Competition Results
          </h2>
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Trophy className="h-5 w-5" />
                <p className="font-medium">{completionReason}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  }

  // Trophy colors for positions
  const trophyColors = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-700",
  };

  // Background gradients for positions
  const positionGradients = {
    1: "from-yellow-100 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-800/30",
    2: "from-gray-100 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/10 border-gray-200 dark:border-gray-800/30",
    3: "from-amber-100 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200 dark:border-amber-800/30",
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-yellow-500" />
        Competition Winners (Qualified by Required Likes)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {winners.map((winner) => (
          <Card
            key={winner.userId}
            className={cn(
              "overflow-hidden border bg-gradient-to-br",
              positionGradients[winner.position as 1 | 2 | 3]
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={winner.avatarUrl || ""} alt={winner.displayName} />
                    <AvatarFallback>{winner.displayName.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                    <Trophy className={cn("h-4 w-4", trophyColors[winner.position as 1 | 2 | 3])} />
                  </div>
                </div>
                <div>
                  <Link href={`/users/${winner.username}`} className="font-medium hover:underline">
                    {winner.displayName}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {winner.position === 1 ? "1st" : winner.position === 2 ? "2nd" : "3rd"} Place
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  href={`/posts/${winner.postId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View Winning Post
                </Link>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-sm cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                        <span>{winner.likes}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{winner.likes} likes during competition</p>
                      {winner.totalLikes > winner.likes && (
                        <p className="text-xs text-muted-foreground">{winner.totalLikes} total likes</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
