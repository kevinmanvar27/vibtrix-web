import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import PostTable from "./components/PostTable";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Post Management",
};

// Enable ISR with 60 second revalidation
export const revalidate = 60;

interface PostsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    type?: string;
  };
}

async function getPosts(page: number = 1, limit: number = 50, type?: string) {
  const skip = (page - 1) * limit;

  // Build where clause based on media type filter
  let where: any = {};
  
  if (type === 'images') {
    where = {
      attachments: {
        some: { type: "IMAGE" }
      }
    };
  } else if (type === 'videos') {
    where = {
      attachments: {
        some: { type: "VIDEO" }
      }
    };
  }

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
          },
          take: 1, // Only need first attachment for preview
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

// OPTIMIZED: Get counts using groupBy on media table instead of nested queries
async function getPostCounts() {
  // Get total post count and media counts in parallel
  const [allCount, mediaCounts] = await Promise.all([
    prisma.post.count(),
    prisma.media.groupBy({
      by: ['type'],
      _count: { postId: true },
      where: {
        postId: { not: null }
      }
    }),
  ]);

  const mediaCountMap = new Map(mediaCounts.map(m => [m.type, m._count.postId]));

  return { 
    allCount, 
    imageCount: mediaCountMap.get('IMAGE') || 0, 
    videoCount: mediaCountMap.get('VIDEO') || 0 
  };
}

// Loading skeleton for the table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '50', 10);
  const type = searchParams.type;

  const [{ posts, totalCount, totalPages, currentPage }, counts] = await Promise.all([
    getPosts(page, limit, type),
    getPostCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post Management</h1>
          <p className="text-muted-foreground">
            Manage posts, review content, and moderate uploads.
            <span className="ml-2 text-sm">({totalCount} posts)</span>
          </p>
        </div>
        <Button variant="destructive" asChild>
          <Link href="/admin/posts/bulk-delete">
            <Trash2 className="mr-2 h-4 w-4" />
            Bulk Delete All Posts
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={type || "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <a href="/admin/posts">All Posts ({counts.allCount})</a>
          </TabsTrigger>
          <TabsTrigger value="images" asChild>
            <a href="/admin/posts?type=images">Images ({counts.imageCount})</a>
          </TabsTrigger>
          <TabsTrigger value="videos" asChild>
            <a href="/admin/posts?type=videos">Videos ({counts.videoCount})</a>
          </TabsTrigger>
          <TabsTrigger value="reported" asChild>
            <a href="/admin/posts?type=reported">Reported (0)</a>
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {type === 'images' ? 'Image' : 
               type === 'videos' ? 'Video' : 
               type === 'reported' ? 'Reported' : 'All'} Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {type === 'reported' ? (
              <p className="text-muted-foreground">Reported posts will be displayed here once reporting functionality is implemented.</p>
            ) : (
              <Suspense fallback={<TableSkeleton />}>
                <PostTable 
                  posts={posts}
                  pagination={{
                    currentPage,
                    totalPages,
                    totalCount,
                  }}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
