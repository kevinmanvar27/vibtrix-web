import { validateRequest } from "@/auth";
import RawPageContent from "@/components/admin/RawPageContent";
import prisma from "@/lib/prisma";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DEFAULT_STATIC_PAGES } from "@/lib/seed-static-pages";

interface PageProps {
  params: { slug: string };
}

const getPage = cache(async (slug: string) => {
  const page = await prisma.page.findUnique({
    where: {
      slug,
      isPublished: true,
    },
  });

  if (!page) notFound();

  return page;
});

export async function generateMetadata({
  params: { slug },
}: PageProps): Promise<Metadata> {
  const page = await getPage(slug);

  return {
    title: page.title,
  };
}

export default async function Page({ params: { slug } }: PageProps) {
  const { user } = await validateRequest();
  const page = await getPage(slug);

  // Check if this is a static page (terms, privacy, etc.)
  const isStaticPage = DEFAULT_STATIC_PAGES.some(p => p.slug === slug);

  // Allow access to static pages for all users, but require login for other pages
  if (!user && !isStaticPage) {
    return (
      <div className="container py-10">
        <div className="max-w-3xl mx-auto bg-card p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-4">{page.title}</h1>
          <p className="text-destructive mb-4">
            You need to be logged in to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto bg-card p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4">{page.title}</h1>
        <div className="prose dark:prose-invert max-w-none">
          <RawPageContent content={page.content} />
        </div>
      </div>
    </div>
  );
}
