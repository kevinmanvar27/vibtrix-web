"use client";

import { CompetitionCard } from "@/components/competitions/CompetitionCard";
import { Skeleton } from "@/components/ui/skeleton";
import debug from "@/lib/debug";
import { CompetitionMediaType } from "@prisma/client";
import { useEffect, useState } from "react";

interface Competition {
  id: string;
  slug?: string | null;
  title: string;
  description: string;
  isPaid: boolean;
  entryFee: number | null;
  mediaType: CompetitionMediaType;
  isActive: boolean;
  hasPrizes: boolean;
  rounds: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    likesToPass: number | null;
  }[];
  _count: {
    participants: number;
  };
}

interface CompetitionListProps {
  status: "active" | "upcoming" | "past" | "all";
}

export default function CompetitionList({ status }: CompetitionListProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      setError(null);

      try {
        debug.log(`Fetching competitions with status: ${status}`);
        const response = await fetch(`/api/competitions?status=${status}`, {
          // Add cache control to avoid stale data
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Log the raw response for debugging
        debug.log(`Response status: ${response.status}`);

        if (!response.ok) {
          // Check if it's an authentication error
          if (response.status === 401) {
            debug.warn("User not authenticated, redirecting to login");
            throw new Error("Please log in to view competitions");
          } else {
            // Try to get more detailed error information
            const errorText = await response.text();
            debug.error("Server error response text:", errorText);

            let errorData = null;
            try {
              errorData = JSON.parse(errorText);
            } catch (parseError) {
              debug.error("Failed to parse error response as JSON", parseError);
            }

            debug.error("Server error response data:", errorData);
            throw new Error(errorData?.error || "Failed to fetch competitions");
          }
        }

        const responseText = await response.text();
        debug.log(`Raw response: ${responseText.substring(0, 200)}...`);

        let data;
        try {
          data = JSON.parse(responseText);
          debug.log(`Received ${data.length} competitions from API for status: ${status}`);

          // Log each competition for debugging
          data.forEach((comp: any) => {
            debug.log(`Competition in client (${status} tab): ${comp.id} - ${comp.title}`, {
              isActive: comp.isActive,
              roundsCount: comp.rounds.length,
              firstRoundStart: comp.rounds.length > 0 ? new Date(comp.rounds[0].startDate).toISOString() : 'N/A',
              firstRoundEnd: comp.rounds.length > 0 ? new Date(comp.rounds[0].endDate).toISOString() : 'N/A'
            });
          });

          setCompetitions(data);
        } catch (parseError) {
          debug.error("Failed to parse response as JSON", parseError);
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        debug.error("Error fetching competitions:", err);
        setError(`Failed to load competitions. Please try again later. ${err instanceof Error ? err.message : ''}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [status]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No competitions found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {competitions.map((competition) => (
        <CompetitionCard key={competition.id} competition={competition} />
      ))}
    </div>
  );
}
