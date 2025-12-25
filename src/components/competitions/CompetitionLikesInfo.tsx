"use client";

import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart } from "lucide-react";
import apiClient from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

import debug from "@/lib/debug";

interface CompetitionLikesInfoProps {
  postId: string;
  competitionId: string;
}

interface CompetitionLikesData {
  competitionLikes: number;
  totalLikes: number;
}

export default function CompetitionLikesInfo({ postId, competitionId }: CompetitionLikesInfoProps) {
  const [likesData, setLikesData] = useState<CompetitionLikesData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCompetitionLikes = async () => {
      try {
        setLoading(true);
        // Fetch competition likes data from the API
        const response = await apiClient.get<CompetitionLikesData>(`/api/competitions/${competitionId}/posts/${postId}/likes`);
        setLikesData(response.data as CompetitionLikesData);
      } catch (error) {
        debug.error("Error fetching competition likes:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load competition likes information",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionLikes();
  }, [postId, competitionId, toast]);

  if (loading || !likesData) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Heart className="h-5 w-5" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <Heart className="h-5 w-5 text-pink-500" />
            <span className="text-sm font-medium">{likesData.competitionLikes} competition likes</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{likesData.competitionLikes} likes during competition</p>
          {likesData.totalLikes > likesData.competitionLikes && (
            <p className="text-xs text-muted-foreground">{likesData.totalLikes} total likes</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
