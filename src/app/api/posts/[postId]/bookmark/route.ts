import prisma from "@/lib/prisma";
import { BookmarkInfo } from "@/lib/types";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if bookmarks feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { bookmarksEnabled: true },
    });

    if (!settings?.bookmarksEnabled) {
      return Response.json({ error: "Bookmarks feature is currently disabled" }, { status: 403 });
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: loggedInUser.id,
          postId,
        },
      },
    });

    const data: BookmarkInfo = {
      isBookmarkedByUser: !!bookmark,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if bookmarks feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { bookmarksEnabled: true },
    });

    if (!settings?.bookmarksEnabled) {
      return Response.json({ error: "Bookmarks feature is currently disabled" }, { status: 403 });
    }

    await prisma.bookmark.upsert({
      where: {
        userId_postId: {
          userId: loggedInUser.id,
          postId,
        },
      },
      create: {
        userId: loggedInUser.id,
        postId,
      },
      update: {},
    });

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if bookmarks feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { bookmarksEnabled: true },
    });

    if (!settings?.bookmarksEnabled) {
      return Response.json({ error: "Bookmarks feature is currently disabled" }, { status: 403 });
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
