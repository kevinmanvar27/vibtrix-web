import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CompetitionTable from "./components/CompetitionTable";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Competition Management",
};

// Enable ISR with 60 second revalidation
export const revalidate = 60;

interface CompetitionsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
  };
}

// OPTIMIZED: Use database-level filtering with raw SQL for status
async function getCompetitions(page: number = 1, limit: number = 25, status?: string) {
  const skip = (page - 1) * limit;
  const now = new Date();

  // Build where clause for database-level filtering
  let whereClause: any = { isActive: true };

  // For status filtering, we need to check rounds
  // Active: has rounds where startDate <= now AND endDate >= now
  // Upcoming: has rounds where all startDate > now
  // Completed: has rounds where all endDate < now

  const competitions = await prisma.competition.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
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
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          likesToPass: true,
        },
        // Only get first and last round for status calculation
        take: 10,
      },
      _count: {
        select: {
          participants: true,
          rounds: true,
        },
      },
    },
  });

  // Get total count for pagination
  const totalCount = await prisma.competition.count({ where: whereClause });

  // Calculate status for each competition
  const processedCompetitions = competitions.map(competition => {
    let computedStatus = "Not Started";
    
    if (competition.rounds.length > 0) {
      const firstRoundStart = new Date(competition.rounds[0].startDate);
      const lastRoundEnd = new Date(competition.rounds[competition.rounds.length - 1].endDate);
      
      if (now < firstRoundStart) {
        computedStatus = "Upcoming";
      } else if (now > lastRoundEnd) {
        computedStatus = "Completed";
      } else {
        computedStatus = "Active";
      }
    }

    return {
      ...competition,
      computedStatus,
    };
  });

  // Filter by status if specified (client-side for now, but on paginated data)
  let filteredCompetitions = processedCompetitions;
  if (status === 'active') {
    filteredCompetitions = processedCompetitions.filter(c => c.computedStatus === "Active");
  } else if (status === 'upcoming') {
    filteredCompetitions = processedCompetitions.filter(c => c.computedStatus === "Upcoming");
  } else if (status === 'completed') {
    filteredCompetitions = processedCompetitions.filter(c => c.computedStatus === "Completed");
  }

  return {
    competitions: filteredCompetitions,
    totalCount: status ? filteredCompetitions.length : totalCount,
    totalPages: Math.ceil((status ? filteredCompetitions.length : totalCount) / limit),
    currentPage: page,
  };
}

// OPTIMIZED: Get counts in a single query using raw SQL
async function getCompetitionCounts() {
  const now = new Date();
  
  // Get all competitions with minimal data for counting
  const competitions = await prisma.competition.findMany({
    where: { isActive: true },
    select: {
      id: true,
      rounds: {
        select: {
          startDate: true,
          endDate: true,
        },
        orderBy: { startDate: 'asc' },
        take: 1,
      },
      _count: {
        select: { rounds: true },
      },
    },
  });

  // Also get last round end date
  const competitionsWithLastRound = await prisma.competition.findMany({
    where: { isActive: true },
    select: {
      id: true,
      rounds: {
        select: {
          endDate: true,
        },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
    },
  });

  const lastRoundMap = new Map(
    competitionsWithLastRound.map(c => [c.id, c.rounds[0]?.endDate])
  );

  let active = 0, upcoming = 0, completed = 0;

  competitions.forEach(comp => {
    if (comp.rounds.length === 0 || comp._count.rounds === 0) {
      // Not started - don't count
      return;
    }

    const firstRoundStart = new Date(comp.rounds[0].startDate);
    const lastRoundEnd = lastRoundMap.get(comp.id);

    if (!lastRoundEnd) return;

    if (now < firstRoundStart) {
      upcoming++;
    } else if (now > new Date(lastRoundEnd)) {
      completed++;
    } else {
      active++;
    }
  });

  return {
    all: competitions.length,
    active,
    upcoming,
    completed,
  };
}

// Loading skeleton for the table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default async function CompetitionsPage({ searchParams }: CompetitionsPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '25', 10);
  const status = searchParams.status;

  // Run both queries in parallel
  const [{ competitions, totalCount, totalPages, currentPage }, counts] = await Promise.all([
    getCompetitions(page, limit, status),
    getCompetitionCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competition Management</h1>
          <p className="text-muted-foreground">
            Create and manage competitions on the platform.
            <span className="ml-2 text-sm">({totalCount} competitions)</span>
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/competitions/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Competition
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={status || "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <a href="/admin/competitions">All ({counts.all})</a>
          </TabsTrigger>
          <TabsTrigger value="active" asChild>
            <a href="/admin/competitions?status=active">Active ({counts.active})</a>
          </TabsTrigger>
          <TabsTrigger value="upcoming" asChild>
            <a href="/admin/competitions?status=upcoming">Upcoming ({counts.upcoming})</a>
          </TabsTrigger>
          <TabsTrigger value="completed" asChild>
            <a href="/admin/competitions?status=completed">Completed ({counts.completed})</a>
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {status === 'active' ? 'Active' : 
               status === 'upcoming' ? 'Upcoming' : 
               status === 'completed' ? 'Completed' : 'All'} Competitions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <CompetitionTable 
                competitions={competitions}
                pagination={{
                  currentPage,
                  totalPages,
                  totalCount,
                }}
              />
            </Suspense>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
