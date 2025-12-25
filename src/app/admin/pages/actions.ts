"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { DEFAULT_STATIC_PAGES } from "@/lib/seed-static-pages";

const pageSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens",
  }),
  content: z.string().min(10, "Content must be at least 10 characters"),
  isPublished: z.boolean(),
});

export type PageFormValues = z.infer<typeof pageSchema>;

export async function createPage(data: PageFormValues) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const validatedData = pageSchema.parse(data);

  // Check if slug is already taken
  const existingPage = await prisma.page.findUnique({
    where: { slug: validatedData.slug },
  });

  if (existingPage) {
    throw new Error("Slug is already taken");
  }

  // Create page
  const page = await prisma.page.create({
    data: validatedData,
  });

  return page;
}

export async function updatePage(id: string, data: PageFormValues) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const validatedData = pageSchema.parse(data);

  // Check if slug is already taken by another page
  const existingPage = await prisma.page.findFirst({
    where: {
      slug: validatedData.slug,
      id: { not: id },
    },
  });

  if (existingPage) {
    throw new Error("Slug is already taken");
  }

  // Update page
  const page = await prisma.page.update({
    where: { id },
    data: validatedData,
  });

  return page;
}

export async function togglePageStatus(id: string, isPublished: boolean) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const page = await prisma.page.update({
    where: { id },
    data: { isPublished },
  });

  return page;
}

export async function deletePage(id: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Get the page to check if it's a static page
  const page = await prisma.page.findUnique({
    where: { id },
  });

  if (!page) {
    throw new Error("Page not found");
  }

  // Check if it's a static page
  const isStaticPage = DEFAULT_STATIC_PAGES.some(p => p.slug === page.slug);

  if (isStaticPage) {
    throw new Error("Cannot delete static pages");
  }

  await prisma.page.delete({
    where: { id },
  });

  return { success: true };
}
