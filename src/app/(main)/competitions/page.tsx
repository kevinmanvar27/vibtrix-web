import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Clock, Award, AlertCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { CompetitionCard } from "@/components/competitions/CompetitionCard";
import { cn } from "@/lib/utils";
import { validateRequest } from "@/auth";

import debug from "@/lib/debug";

export const metadata = {
  title: "Competitions - Vibtrix",
  description: "Participate in exciting competitions on Vibtrix",
};

async function getCompetitions(status: "active" | "upcoming" | "past") {
  try {
    // Define the where clause based on status
    let whereClause: any = {};

    if (status === "active") {
      // Active competitions are those that are marked as active and have at least one round
      // that has started, and the last round has not ended yet
      whereClause = {
        isActive: true,
        AND: [
          {
            // At least one round has started
            rounds: {
              some: {
                startDate: { lte: new Date() },
              },
            },
          },
          {
            // The last round has not ended yet
            rounds: {
              some: {
                endDate: { gte: new Date() },
              },
            },
          },
        ],
      };
    } else if (status === "upcoming") {
      // Upcoming competitions are those that are marked as active but haven't started yet
      // (all rounds have start dates in the future)
      whereClause = {
        isActive: true,
        rounds: {
          every: {
            startDate: { gt: new Date() },
          },
        },
      };
    } else if (status === "past") {
      // Past competitions are those where all rounds have ended
      // Only show competitions that are active (isActive: true)
      // AND ensure they don't qualify as upcoming competitions
      whereClause = {
        isActive: true,
        rounds: {
          every: {
            endDate: { lt: new Date() },
          },
        },
        // Make sure at least one round exists
        AND: [
          {
            rounds: {
              some: {}
            }
          }
        ],
        // Make sure it's not an upcoming competition (at least one round has started)
        NOT: {
          rounds: {
            every: {
              startDate: { gt: new Date() },
            },
          },
        },
      };
    }

    // Get competitions
    const competitions = await prisma.competition.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPaid: true,
        entryFee: true,
        mediaType: true,
        isActive: true,
        hasPrizes: true,
        createdAt: true,
        updatedAt: true,
        rounds: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            likesToPass: true,
            createdAt: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        },
        _count: {
          select: {
            participants: true,
            prizes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out duplicate rounds by name for each competition
    const competitionsWithUniqueRounds = competitions.map(competition => {
      // Create a map to store unique rounds by name
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
      return {
        ...competition,
        rounds: Array.from(uniqueRoundsByName.values()),
      };
    });

    return competitionsWithUniqueRounds;
  } catch (error) {
    debug.error(`Error fetching ${status} competitions:`, error);
    return [];
  }
}

// Function to check if user has participated in any of the upcoming competitions
async function checkUserParticipation(userId: string, competitionIds: string[]) {
  if (!userId || competitionIds.length === 0) {
    return [];
  }

  try {
    // Find all competition participants for this user and the given competitions
    const participants = await prisma.competitionParticipant.findMany({
      where: {
        userId: userId,
        competitionId: {
          in: competitionIds
        }
      },
      select: {
        competitionId: true
      }
    });

    // Return array of competition IDs the user is participating in
    return participants.map(p => p.competitionId);
  } catch (error) {
    debug.error("Error checking user participation:", error);
    return [];
  }
}

export default async function CompetitionsPage() {
  // Get current user if logged in
  const { user } = await validateRequest();
  const userId = user?.id;

  // Fetch competitions for each tab
  const activeCompetitions = await getCompetitions("active");
  const upcomingCompetitions = await getCompetitions("upcoming");
  const pastCompetitions = await getCompetitions("past");

  // Check which upcoming competitions the user is already participating in
  const participatingCompetitionIds = userId
    ? await checkUserParticipation(
        userId,
        upcomingCompetitions.map(comp => comp.id)
      )
    : [];

  // Filter to get only upcoming competitions the user is not participating in
  const newUpcomingCompetitions = upcomingCompetitions.filter(
    comp => !participatingCompetitionIds.includes(comp.id)
  );

  return (
    <main className="w-full min-w-0">
      <div className="w-full min-w-0 space-y-6">
        {/* Competition Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <div className="sticky top-[5.25rem] z-10 bg-background pt-2 pb-4">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Active</span>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center gap-2 relative">
                <Calendar className="h-4 w-4" />
                <span>Upcoming</span>
                {newUpcomingCompetitions.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Past</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Active Competitions</h2>
              <p className="text-muted-foreground">Join now and start competing!</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCompetitions.length > 0 ? (
                activeCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No active competitions found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6 mt-0">
            <div className={cn(
              "flex items-center justify-between",
              newUpcomingCompetitions.length > 0 ? "bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800" : ""
            )}>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">Upcoming Competitions</h2>
                {newUpcomingCompetitions.length > 0 && (
                  <span className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    New
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">Get ready for these events</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingCompetitions.length > 0 ? (
                upcomingCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No upcoming competitions found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Past Competitions</h2>
              <p className="text-muted-foreground">View previous competitions</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastCompetitions.length > 0 ? (
                pastCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No past competitions found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
