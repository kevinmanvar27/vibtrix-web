import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompetitionTable from "./components/CompetitionTable";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const metadata = {
  title: "Competition Management",
};

async function getCompetitions() {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      isPaid: true,
      entryFee: true,
      mediaType: true,
      isActive: true,
      hasPrizes: true,
      showStickeredMedia: true,
      rounds: {
        orderBy: {
          startDate: 'asc',
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          likesToPass: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          participants: true,
          rounds: true,
        },
      },
    },
  });

  // Filter out duplicate rounds by name for each competition
  return competitions.map(competition => {
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
}

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  const now = new Date();

  // Helper function to determine competition lifecycle status
  const getCompetitionStatus = (comp: any) => {
    if (comp.rounds.length === 0) return "Not Started";

    // Check if any round has started
    const anyRoundStarted = comp.rounds.some((round: any) =>
      new Date(round.startDate) <= now
    );

    // Check if all rounds have ended
    const allRoundsEnded = comp.rounds.every((round: any) =>
      new Date(round.endDate) < now
    );

    if (anyRoundStarted) {
      if (allRoundsEnded) {
        return "Completed";
      } else {
        return "Active";
      }
    }

    return "Upcoming";
  };

  // Filter competitions by their lifecycle status
  const activeCompetitions = competitions.filter(comp =>
    comp.isActive && getCompetitionStatus(comp) === "Active"
  );

  const upcomingCompetitions = competitions.filter(comp =>
    comp.isActive && getCompetitionStatus(comp) === "Upcoming"
  );

  const pastCompetitions = competitions.filter(comp =>
    comp.isActive && getCompetitionStatus(comp) === "Completed"
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competition Management</h1>
          <p className="text-muted-foreground">
            Create and manage competitions on the platform.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/competitions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Competition
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Competitions ({competitions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCompetitions.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingCompetitions.length})</TabsTrigger>
          <TabsTrigger value="past">Completed ({pastCompetitions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Competitions ({competitions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CompetitionTable competitions={competitions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Competitions ({activeCompetitions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CompetitionTable competitions={activeCompetitions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Competitions ({upcomingCompetitions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CompetitionTable competitions={upcomingCompetitions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Competitions ({pastCompetitions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CompetitionTable competitions={pastCompetitions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
