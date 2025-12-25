import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageTable from "./components/PageTable";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { DEFAULT_STATIC_PAGES } from "@/lib/seed-static-pages";

export const metadata = {
  title: "Page Management",
};

async function getPages() {
  return await prisma.page.findMany({
    orderBy: { title: "asc" },
  });
}

export default async function PagesPage({
  searchParams,
}: {
  searchParams: { slug?: string };
}) {
  // If a slug is provided, find the page and redirect to its edit page
  if (searchParams.slug) {
    const page = await prisma.page.findFirst({
      where: { slug: searchParams.slug },
    });

    // If the page exists, redirect to its edit page
    if (page) {
      redirect(`/admin/pages/${page.id}/edit`);
    } else {
      // If the page doesn't exist, check if it's a default static page
      const defaultPage = DEFAULT_STATIC_PAGES.find(p => p.slug === searchParams.slug);

      if (defaultPage) {
        // Create the page and redirect to its edit page
        const newPage = await prisma.page.create({
          data: defaultPage,
        });
        redirect(`/admin/pages/${newPage.id}/edit`);
      }
    }
  }

  const pages = await getPages();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Management</h1>
          <p className="text-muted-foreground">
            Manage static pages and content.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Static Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <PageTable pages={pages} />
        </CardContent>
      </Card>
    </div>
  );
}
