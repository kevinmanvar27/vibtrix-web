import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Users, ArrowLeft, Award, CheckCircle, Clock, Layers, XCircle } from "lucide-react";
import Link from "next/link";
import { getCompetitionParticipantsStats } from "./actions";
import ParticipantsTable from "../components/ParticipantsTable";
import RoundParticipantsTable from "../components/RoundParticipantsTable";
import debug from "@/lib/debug";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Competition Participants",
};

interface CompetitionParticipantsPageProps {
  params: {
    competitionId: string;
  };
}

export default async function CompetitionParticipantsPage({ params }: CompetitionParticipantsPageProps) {
  const { competitionId } = params;

  try {
    const { competition, totalParticipants, roundStats, participants } = await getCompetitionParticipantsStats(competitionId);

    // Ensure we have valid data
    if (!competition || !roundStats || !participants) {
      debug.error("Missing data in competition participants response");
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Competition Participants</h1>
              <p className="text-muted-foreground">
                Error loading participant data
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/competitions">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Competitions
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
                <p className="text-muted-foreground mb-6">There was a problem loading the participant data for this competition.</p>
                <Button asChild>
                  <Link href="/admin/competitions">
                    Back to Competitions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{competition.title}</h1>
            <p className="text-muted-foreground">
              Participants and statistics
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/admin/competitions/${competitionId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Competition
            </Link>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-2" />
                <div className="text-2xl font-bold">{totalParticipants}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualified Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-2xl font-bold">
                  {roundStats.length > 0 && roundStats[roundStats.length - 1].qualifiedEntries}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Layers className="h-5 w-5 text-blue-500 mr-2" />
                <div className="text-2xl font-bold">
                  {competition.rounds.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Round-wise Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Round-wise Statistics</CardTitle>
            <CardDescription>
              Detailed statistics for each round of the competition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Total Entries</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Qualified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roundStats.map((round) => (
                  <TableRow key={round.roundId}>
                    <TableCell className="font-medium">{round.roundName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(round.startDate, "MMM d, yyyy")} - {format(round.endDate, "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>{round.totalEntries}</TableCell>
                    <TableCell>
                      {round.entriesWithPosts} / {round.totalEntries}
                      <span className="text-muted-foreground ml-1">
                        ({Math.round((round.entriesWithPosts / (round.totalEntries || 1)) * 100)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {round.qualifiedEntries}
                        <span className="text-muted-foreground ml-1">
                          ({Math.round((round.qualifiedEntries / (round.entriesWithPosts || 1)) * 100)}%)
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabbed Participants View */}
        <Card>
          <CardHeader>
            <CardTitle>Competition Participants</CardTitle>
            <CardDescription>
              View all participants and round-wise participation details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:flex md:w-auto">
                <TabsTrigger value="all">All Participants</TabsTrigger>
                {competition.rounds.map((round, index) => (
                  <TabsTrigger key={round.id} value={round.id}>
                    {round.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* All Participants Tab */}
              <TabsContent value="all" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">All Participants ({totalParticipants})</h3>
                </div>
                <ParticipantsTable participants={participants} competitionId={competitionId} />
              </TabsContent>

              {/* Round Tabs */}
              {roundStats.map((round, index) => (
                <TabsContent key={round.roundId} value={round.roundId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{round.roundName}</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">Submissions:</span> {round.entriesWithPosts}/{round.totalEntries}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Qualified:</span> {round.qualifiedEntries}
                      </div>
                    </div>
                  </div>
                  <RoundParticipantsTable
                    roundEntries={round.roundEntries}
                    roundName={round.roundName}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    debug.error("Error fetching competition participants:", error);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Competition Participants</h1>
            <p className="text-muted-foreground">
              Error loading participant data
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/competitions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Competitions
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
              <p className="text-muted-foreground mb-6">There was a problem loading the participant data for this competition.</p>
              <p className="text-sm text-red-500 mb-6 max-w-md mx-auto">{error instanceof Error ? error.message : String(error)}</p>
              <Button asChild>
                <Link href="/admin/competitions">
                  Back to Competitions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
