import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { syncRoundEntries } from "./action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default async function SyncRoundEntriesPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const { user } = await validateRequest();

  if (!user?.isAdmin) {
    redirect("/login");
  }

  const { competitionId } = params;

  // Get the competition details
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      rounds: {
        orderBy: {
          startDate: 'asc',
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  if (!competition) {
    redirect("/admin/competitions");
  }

  // Get the count of entries with posts
  const entriesWithPostsCount = await prisma.competitionRoundEntry.count({
    where: {
      round: {
        competitionId,
      },
      postId: {
        not: null,
      },
    },
  });

  // Get the count of invisible entries
  const currentDate = new Date();
  const invisibleEntriesCount = await prisma.competitionRoundEntry.count({
    where: {
      round: {
        competitionId,
        startDate: { lte: currentDate },
      },
      OR: [
        { visibleInCompetitionFeed: false },
        { visibleInNormalFeed: false }
      ],
      postId: {
        not: null,
      },
    },
  });

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link
          href={`/admin/competitions/${competitionId}`}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Competition
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Synchronize Round Entries</CardTitle>
          <CardDescription>
            Update the visibility of competition entries based on round start dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Competition: {competition.title}</h3>
              <p className="text-sm text-muted-foreground">
                {competition._count.participants} participants, {competition.rounds.length} rounds
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Total Entries with Posts</p>
                <p className="text-2xl font-bold">{entriesWithPostsCount}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Invisible Entries</p>
                <p className="text-2xl font-bold">{invisibleEntriesCount}</p>
                {invisibleEntriesCount > 0 && (
                  <p className="text-xs text-amber-500 mt-1">
                    These entries need to be synchronized
                  </p>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Rounds</h4>
              <div className="space-y-2">
                {competition.rounds.map((round) => {
                  const roundStarted = new Date(round.startDate) <= currentDate;
                  const roundEnded = new Date(round.endDate) < currentDate;
                  
                  let status = "Upcoming";
                  let statusClass = "text-blue-500";
                  
                  if (roundStarted && !roundEnded) {
                    status = "Active";
                    statusClass = "text-green-500";
                  } else if (roundEnded) {
                    status = "Completed";
                    statusClass = "text-gray-500";
                  }
                  
                  return (
                    <div key={round.id} className="flex justify-between items-center text-sm p-2 border-b last:border-0">
                      <div>
                        <span className="font-medium">{round.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(round.startDate).toLocaleDateString()} - {new Date(round.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={statusClass}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            This will update the visibility of all entries based on whether their rounds have started.
          </p>
          <form action={async () => {
            "use server";
            await syncRoundEntries(competitionId);
          }}>
            <Button type="submit" className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchronize Entries
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
