import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Edit, Globe } from "lucide-react";
import Link from "next/link";
import PageContent from "@/components/admin/PageContent";

export const metadata = {
  title: "Page Details",
};

interface PageDetailsPageProps {
  params: {
    pageId: string;
  };
}

async function getPage(id: string) {
  const page = await prisma.page.findUnique({
    where: { id },
  });

  if (!page) {
    notFound();
  }

  return page;
}

export default async function PageDetailsPage({ params }: PageDetailsPageProps) {
  const page = await getPage(params.pageId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
          <p className="text-muted-foreground">
            Page details and content preview.
          </p>
        </div>
        <div className="flex gap-2">
          {page.isPublished && (
            <Button variant="outline" asChild>
              <Link href={`/pages/${page.slug}`} target="_blank">
                <Globe className="mr-2 h-4 w-4" />
                View Live
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/admin/pages/${page.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Page
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Page Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Status</h3>
              <Badge variant={page.isPublished ? "default" : "secondary"}>
                {page.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>

            <div>
              <h3 className="font-medium">Slug</h3>
              <code className="rounded bg-muted px-1 py-0.5">{page.slug}</code>
            </div>

            <div>
              <h3 className="font-medium">Created</h3>
              <p>{format(page.createdAt, "MMMM d, yyyy")}</p>
            </div>

            <div>
              <h3 className="font-medium">Last Updated</h3>
              <p>{format(page.updatedAt, "MMMM d, yyyy HH:mm")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Content Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <PageContent content={page.content} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
