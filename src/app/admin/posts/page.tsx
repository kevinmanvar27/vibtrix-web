import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import PostTable from "./components/PostTable";

export const metadata = {
  title: "Post Management",
};

async function getPosts() {
  return await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      attachments: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });
}

export default async function PostsPage() {
  const posts = await getPosts();

  const imagePosts = posts.filter(post =>
    post.attachments.some(attachment => attachment.type === "IMAGE")
  );

  const videoPosts = posts.filter(post =>
    post.attachments.some(attachment => attachment.type === "VIDEO")
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post Management</h1>
          <p className="text-muted-foreground">
            Manage posts, review content, and moderate uploads.
          </p>
        </div>
        <Button variant="destructive" asChild>
          <Link href="/admin/posts/bulk-delete">
            <Trash2 className="mr-2 h-4 w-4" />
            Bulk Delete All Posts
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="reported">Reported</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <PostTable posts={posts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Image Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <PostTable posts={imagePosts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <PostTable posts={videoPosts} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reported" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reported Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Reported posts will be displayed here once reporting functionality is implemented.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
