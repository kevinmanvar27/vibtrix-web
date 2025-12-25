"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, IndianRupee } from "lucide-react";

interface Prize {
  position: string;
  amount: number;
  description: string | null;
}

interface PrizeDistributionCardProps {
  prizes: Prize[];
}

export default function PrizeDistributionCard({ prizes }: PrizeDistributionCardProps) {
  if (!prizes || prizes.length === 0) {
    return null;
  }

  // Sort prizes by position
  const sortedPrizes = [...prizes].sort((a, b) => {
    const order = { "FIRST": 1, "SECOND": 2, "THIRD": 3, "FOURTH": 4, "FIFTH": 5, "PARTICIPATION": 6 };
    return order[a.position] - order[b.position];
  });

  const getPositionLabel = (position: string) => {
    switch (position) {
      case "FIRST":
        return "1st Place";
      case "SECOND":
        return "2nd Place";
      case "THIRD":
        return "3rd Place";
      case "FOURTH":
        return "4th Place";
      case "FIFTH":
        return "5th Place";
      case "PARTICIPATION":
        return "Participation";
      default:
        return position;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          Prize Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedPrizes.map((prize) => (
            <div key={prize.position} className="flex justify-between items-center">
              <div className="font-medium">{getPositionLabel(prize.position)}</div>
              <div className="flex items-center font-semibold text-amber-700 dark:text-amber-500">
                <IndianRupee className="h-3.5 w-3.5 mr-1" />
                {prize.amount.toLocaleString()}
                {prize.description && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({prize.description})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
