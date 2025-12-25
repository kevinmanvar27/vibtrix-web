"use client";

import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCompetitionUrl } from "@/lib/slug-utils";

interface ViewCompetitionButtonProps {
  competitionId: string;
  competitionSlug?: string | null;
  isActive: boolean;
}

export default function ViewCompetitionButton({
  competitionId,
  competitionSlug,
  isActive
}: ViewCompetitionButtonProps) {
  const router = useRouter();

  if (!isActive) {
    return null;
  }

  const handleClick = () => {
    // Navigate to the competition page with the feed tab selected
    const competitionUrl = getCompetitionUrl({ id: competitionId, slug: competitionSlug });
    router.push(`${competitionUrl}?tab=feed`);
  };

  return (
    <Button
      variant="outline"
      className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
      onClick={handleClick}
    >
      <Trophy className="mr-2 h-4 w-4" />
      View Competition Feed
    </Button>
  );
}
