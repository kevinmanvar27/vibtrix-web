import { QueryClient } from "@tanstack/react-query";

/**
 * Invalidates all competition feed queries for a specific competition
 * This ensures that when a post is edited, all views (All Rounds and specific rounds)
 * are refreshed with the latest data
 */
export function invalidateCompetitionFeedQueries(
  queryClient: QueryClient,
  competitionId: string
) {
  // Invalidate the "All Rounds" view
  queryClient.invalidateQueries({
    queryKey: ["competition-feed", competitionId, null],
  });

  // Invalidate any specific round views
  // This uses a partial key match to catch all round-specific queries
  queryClient.invalidateQueries({
    queryKey: ["competition-feed", competitionId],
    exact: false,
  });
}
