import prisma from "@/lib/prisma";
import { MetadataRoute } from "next";

// Force dynamic rendering - don't try to generate at build time
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Static routes - always available
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/competitions`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  try {
    // Get all public competitions
    const competitions = await prisma.competition.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true },
    });

    // Get all public pages
    const pages = await prisma.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });

    // Get all public user profiles
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        isProfilePublic: true,
      },
      select: { username: true, createdAt: true },
    });

    // Competition routes
    const competitionRoutes = competitions.map((competition) => ({
      url: `${baseUrl}/competitions/${competition.slug || competition.id}`,
      lastModified: competition.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Page routes
    const pageRoutes = pages.map((page) => ({
      url: `${baseUrl}/pages/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // User routes
    const userRoutes = users.map((user) => ({
      url: `${baseUrl}/users/${user.username}`,
      lastModified: user.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...competitionRoutes, ...pageRoutes, ...userRoutes];
  } catch (error) {
    // If database is not available, return only static routes
    console.error("Sitemap: Database connection failed, returning static routes only", error);
    return staticRoutes;
  }
}