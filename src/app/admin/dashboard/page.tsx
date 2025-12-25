import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Trophy, AlertTriangle } from "lucide-react";
import DashboardTabs from "./components/DashboardTabs";
import { RazorpayStatusAlert } from "@/components/admin/RazorpayStatusAlert";

export const metadata = {
  title: "Admin Dashboard",
};

async function getStats() {
  const [
    totalUsers,
    activeUsers,
    totalPosts,
    totalImagePosts,
    totalVideoPosts,
    totalCompetitions,
    activeCompetitions,
    reportedContent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.post.count(),
    prisma.media.count({ where: { type: "IMAGE" } }),
    prisma.media.count({ where: { type: "VIDEO" } }),
    prisma.competition.count(),
    prisma.competition.count({ where: { isActive: true } }),
    0, // Placeholder for reported content count (to be implemented)
  ]);

  return {
    totalUsers,
    activeUsers,
    totalPosts,
    totalImagePosts,
    totalVideoPosts,
    totalCompetitions,
    activeCompetitions,
    reportedContent,
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
