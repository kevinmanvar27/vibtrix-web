import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit } from "lucide-react";
import Link from "next/link";
import PrizePaymentsSection from "./components/PrizePaymentsSection";
import { HtmlContent } from "@/components/ui/html-content";

export const metadata = {
  title: "Winner Prize Payments - Admin Dashboard",
  description: "Process prize payments for competition winners",
};

interface CompetitionDetailsPageProps {
  params: {
    competitionId: string;
  };
}

async function getCompetition(id: string) {
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          roundEntries: true,
        },
      },
      rounds: {
        orderBy: {
          startDate: 'asc',
        },
      },
      prizes: true,
      _count: {
        select: {
          participants: true,
          rounds: true,
          prizes: true,
        },
      },
    },
  });

  if (!competition) {
    notFound();
  }

  return competition;
}

export default async function CompetitionDetailsPage({ params }: CompetitionDetailsPageProps) {
  const competition = await getCompetition(params.competitionId);

  // Filter out duplicate rounds by name
  const uniqueRoundsByName = new Map();

  // Process each round
  competition.rounds.forEach(round => {
    // If we haven't seen this round name yet, or this round is newer than the one we've seen
    if (!uniqueRoundsByName.has(round.name) ||
      new Date(round.createdAt) > new Date(uniqueRoundsByName.get(round.name).createdAt)) {
      uniqueRoundsByName.set(round.name, round);
    }
  });

  // Replace the rounds array with the filtered one
  competition.rounds = Array.from(uniqueRoundsByName.values());

  // Update the rounds count to reflect the filtered count
  competition._count.rounds = competition.rounds.length;

  // Determine competition lifecycle status
  const currentDate = new Date();
  let lifecycleStatus = "Upcoming";

  if (competition.rounds.length > 0) {
    // Check if any round has started
    const anyRoundStarted = competition.rounds.some(round =>
      new Date(round.startDate) <= currentDate
    );

    // Check if all rounds have ended
    const allRoundsEnded = competition.rounds.every(round =>
      new Date(round.endDate) < currentDate
    );

    if (anyRoundStarted) {
      if (allRoundsEnded) {
        lifecycleStatus = "Completed";
      } else {
        lifecycleStatus = "Active";
      }
    }
  }

  // Get winners if the competition is completed
  let winners = [];
  if (lifecycleStatus === "Completed") {
    // Get the winners from the API
    const winnersResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/competitions/${competition.id}/winners`, {
      cache: 'no-store',
    });

    if (winnersResponse.ok) {
      const winnersData = await winnersResponse.json();

      if (winnersData.isCompleted && winnersData.winners) {
        // Get prize payments for this competition
        const prizePayments = await prisma.prizePayment.findMany({
          where: { competitionId: competition.id },
        });

        // Map winners to include prize and payment information
        winners = winnersData.winners.map((winner: any) => {
          // Find the prize for this position
          const position = winner.position === 1 ? "FIRST" :
            winner.position === 2 ? "SECOND" :
              winner.position === 3 ? "THIRD" : null;

          if (!position) return null;

          // Find the prize for this position from the competition prizes
          const prize = competition.prizes.find(p => p.position === position);

          // Find any existing payment for this user and prize
          const payment = prizePayments.find(p =>
            p.userId === winner.userId &&
            prize && p.prizeId === prize.id
          );

          // Get user's UPI ID
          return {
            position,
            userId: winner.userId,
            username: winner.username,
            displayName: winner.displayName,
            avatarUrl: winner.avatarUrl,
            upiId: null, // We'll fetch this separately
            prize: prize ? {
              id: prize.id,
              amount: prize.amount,
              description: prize.description,
            } : null,
            payment: payment ? {
              id: payment.id,
              status: payment.status,
              processedAt: payment.processedAt,
              transactionId: payment.transactionId,
            } : null,
          };
        }).filter(Boolean);

        // Fetch UPI IDs for winners
        if (winners.length > 0) {
          const userIds = winners.map((w: any) => w.userId);
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, upiId: true },
          });

          // Add UPI IDs to winners
          winners = winners.map((winner: any) => {
            const user = users.find(u => u.id === winner.userId);
            return {
              ...winner,
              upiId: user?.upiId || null,
            };
          });
        }
      }
    }
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Competition Header - Modern Design with Theme Support */}
      <div className="relative overflow-hidden rounded-xl border shadow-md bg-card text-card-foreground dark:bg-card/90">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        </div>

        {/* Admin Actions */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs font-medium bg-background/10 hover:bg-background/20 text-card-foreground border-card-foreground/20">
            <Link href={`/admin/competitions/${competition.id}/fix-feed-visibility-v2`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 mr-1">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Fix Feed
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs font-medium bg-background/10 hover:bg-background/20 text-card-foreground border-card-foreground/20">
            <Link href={`/admin/competitions/${competition.id}/fix-competition-visibility`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 mr-1">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Fix Visibility
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs font-medium bg-background/10 hover:bg-background/20 text-card-foreground border-card-foreground/20">
            <Link href={`/admin/competitions/${competition.id}/edit`}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center font-bold text-xl shadow-md">
              {competition.title.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{competition.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={`px-2 py-0.5 text-xs font-medium border-0 ${lifecycleStatus === "Active" ? "bg-green-500/90 dark:bg-green-600/90 text-white" :
                    lifecycleStatus === "Upcoming" ? "bg-blue-500/90 dark:bg-blue-600/90 text-white" :
                      "bg-amber-500/90 dark:bg-amber-600/90 text-white"
                    }`}
                >
                  {lifecycleStatus}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {competition.id.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/5 backdrop-blur-sm border border-border">
              <span className="text-2xl font-bold">{competition._count.participants}</span>
              <span className="text-xs text-muted-foreground mt-1">Participants</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/5 backdrop-blur-sm border border-border">
              <span className="text-2xl font-bold">{competition._count.rounds}</span>
              <span className="text-xs text-muted-foreground mt-1">Rounds</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/5 backdrop-blur-sm border border-border">
              <span className="text-2xl font-bold">{competition.prizes.length}</span>
              <span className="text-xs text-muted-foreground mt-1">Prizes</span>
            </div>
          </div>

          {/* Description */}
          {competition.description && (
            <div className="mt-5 p-3 rounded-lg bg-background/5 backdrop-blur-sm border border-border text-sm text-muted-foreground">
              <HtmlContent html={competition.description} />
            </div>
          )}
        </div>
      </div>

      {/* Prize Payments Section - Main content */}
      <div id="prize-payments">
        <PrizePaymentsSection competitionId={competition.id} winners={winners} />
      </div>


    </div>
  );
}
