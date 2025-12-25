import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageForm from "../../components/PageForm";

export const metadata = {
  title: "Edit Page",
};

interface EditPagePageProps {
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

export default async function EditPagePage({ params }: EditPagePageProps) {
  const page = await getPage(params.pageId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Page</h1>
        <p className="text-muted-foreground">
          Update page content and settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PageForm page={page} />
        </CardContent>
      </Card>
    </div>
  );
}
