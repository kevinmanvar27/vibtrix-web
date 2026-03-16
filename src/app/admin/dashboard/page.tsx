import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Trophy, AlertTriangle } from "lucide-react";
import DashboardTabs from "./components/DashboardTabs";
import { RazorpayStatusAlert } from "@/components/admin/RazorpayStatusAlert";

export const metadata = {
  title: "Admin Dashboard",
};

// Enable ISR with 60 second revalidation for admin dashboard
export const revalidate = 60;

// OPTIMIZED: Combine all stats into parallel queries with groupBy where possible
async function getStats() {
  const [
    userCounts,
    totalPosts,
    mediaCounts,
    competitionCounts,
  ] = await Promise.all([
    // User counts using groupBy
    prisma.user.groupBy({
      by: ['isActive'],
      _count: { id: true },
    }),
    // Total posts - simple count
    prisma.post.count(),
    // Media counts using groupBy
    prisma.media.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
    // Competition counts using groupBy
    prisma.competition.groupBy({
      by: ['isActive'],
      _count: { id: true },
    }),
  ]);

  // Process user counts
  const userCountMap = new Map(userCounts.map(c => [c.isActive, c._count.id]));
  const totalUsers = userCounts.reduce((sum, c) => sum + c._count.id, 0);
  const activeUsers = userCountMap.get(true) || 0;

  // Process media counts
  const mediaCountMap = new Map(mediaCounts.map(c => [c.type, c._count.id]));
  const totalImagePosts = mediaCountMap.get('IMAGE') || 0;
  const totalVideoPosts = mediaCountMap.get('VIDEO') || 0;

  // Process competition counts
  const competitionCountMap = new Map(competitionCounts.map(c => [c.isActive, c._count.id]));
  const totalCompetitions = competitionCounts.reduce((sum, c) => sum + c._count.id, 0);
  const activeCompetitions = competitionCountMap.get(true) || 0;

  return {
    totalUsers,
    activeUsers,
    totalPosts,
    totalImagePosts,
    totalVideoPosts,
    totalCompetitions,
    activeCompetitions,
    reportedContent: 0, // Placeholder for reported content count
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <RazorpayStatusAlert />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform statistics and metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalImagePosts} images, {stats.totalVideoPosts} videos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competitions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompetitions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCompetitions} active competitions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportedContent}</div>
            <p className="text-xs text-muted-foreground">
              Needs review
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardTabs />
    </div>
  );
}
