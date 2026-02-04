/**
 * API route for generating share links for posts
 * GET /api/posts/[postId]/share-link - Generate shareable links
 * 
 * Returns:
 * - Web URL for browser sharing
 * - Deep link for app-to-app sharing
 * - Universal link for smart routing
 * - Metadata for rich social previews
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

// Get base URL from environment or default
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "https://vidibattle.com";

/**
 * GET /api/posts/[postId]/share-link
 * Public endpoint - no authentication required
 * Generates shareable links and metadata for a post
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    debug.log(`GET /api/posts/${postId}/share-link - Generating share links`);

    // Validate postId
    if (!postId) {
      return Response.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Fetch post with user and media info for metadata
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
            urlThumbnail: true,
            posterUrl: true,
            width: true,
            height: true,
          },
          take: 1, // Get first media for preview
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      debug.log(`GET /api/posts/${postId}/share-link - Post not found`);
      return Response.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!post.user.isActive) {
      debug.log(`GET /api/posts/${postId}/share-link - Post owner is inactive`);
      return Response.json(
        { error: "Post not available" },
        { status: 404 }
      );
    }

    // Get app settings for deep link configuration
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        appDeepLinkScheme: true,
        appUniversalLinkDomain: true,
        appStoreUrl: true,
        playStoreUrl: true,
      },
    });

    const deepLinkScheme = settings?.appDeepLinkScheme || "vidibattle";
    const universalLinkDomain = settings?.appUniversalLinkDomain || BASE_URL.replace(/^https?:\/\//, "");

    // Generate URLs
    const webUrl = `${BASE_URL}/posts/${postId}`;
    const deepLink = `${deepLinkScheme}://post/${postId}`;
    const universalLink = `https://${universalLinkDomain}/posts/${postId}`;

    // Build metadata for social sharing
    const firstMedia = post.attachments[0];
    const previewImage = firstMedia?.urlThumbnail || firstMedia?.posterUrl || firstMedia?.url || post.user.avatarUrl;
    
    // Truncate content for description (max 160 chars for social previews)
    const maxDescLength = 160;
    let description = post.content || "";
    if (description.length > maxDescLength) {
      description = description.substring(0, maxDescLength - 3) + "...";
    }

    // Generate title
    const title = `${post.user.displayName} on VidiBattle`;

    // Build share text for messaging apps
    const shareText = post.content 
      ? `${post.content.substring(0, 100)}${post.content.length > 100 ? "..." : ""}`
      : `Check out this post by ${post.user.displayName}`;

    const response = {
      // URLs for different sharing scenarios
      urls: {
        web: webUrl,
        deepLink: deepLink,
        universalLink: universalLink,
      },

      // Metadata for rich social previews (Open Graph, Twitter Cards, etc.)
      metadata: {
        title: title,
        description: description,
        image: previewImage,
        imageWidth: firstMedia?.width || null,
        imageHeight: firstMedia?.height || null,
        type: firstMedia?.type === "VIDEO" ? "video" : "article",
        author: {
          username: post.user.username,
          displayName: post.user.displayName,
          avatarUrl: post.user.avatarUrl,
        },
      },

      // Pre-formatted share text for different platforms
      shareText: {
        default: `${shareText} ${webUrl}`,
        twitter: `${shareText} via @VidiBattle ${webUrl}`,
        whatsapp: `${shareText}\n\n${webUrl}`,
      },

      // Post stats (useful for some share contexts)
      stats: {
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
      },

      // App store links for "Get the app" prompts
      appStores: {
        ios: settings?.appStoreUrl || null,
        android: settings?.playStoreUrl || null,
      },
    };

    debug.log(`GET /api/posts/${postId}/share-link - Share links generated successfully`);

    return Response.json(response);
  } catch (error) {
    debug.error("GET /api/posts/[postId]/share-link - Error:", error);
    return Response.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}
