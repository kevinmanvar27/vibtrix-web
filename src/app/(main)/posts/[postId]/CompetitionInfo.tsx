"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import CompetitionLikesInfo from "@/components/competitions/CompetitionLikesInfo";

import debug from "@/lib/debug";

interface CompetitionInfoProps {
  postId: string;
}

interface CompetitionData {
  id: string;
  title: string;
  slug: string | null;
}

export default function CompetitionInfo({ postId }: CompetitionInfoProps) {
  const [competition, setCompetition] = useState<CompetitionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitionInfo = async () => {
      try {
        setLoading(true);
        // Fetch competition info for this post
        const response = await apiClient.get(`/api/posts/${postId}/competition-info`);
        setCompetition((response.data as any)?.competition);
      } catch (error) {
        debug.error("Error fetching competition info:", error);
        // If there's an error or no competition found, we'll just hide this component
        setCompetition(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionInfo();
  }, [postId]);

  // If loading or no competition found, don't render anything
  if (loading || !competition) {
    return null;
  }

  const competitionUrl = competition.slug
    ? `/competitions/${competition.slug}`
    : `/competitions/${competition.id}`;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Competition Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">This post was submitted to:</p>
            <Link
              href={competitionUrl}
              className="font-medium hover:underline text-primary"
            >
              {competition.title}
            </Link>
          </div>

          <div className="pt-2">
            <CompetitionLikesInfo postId={postId} competitionId={competition.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
