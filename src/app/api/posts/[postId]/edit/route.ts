import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * PUT /api/posts/[postId]/edit
 * Edit an existing post
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Request body:
 * - content: string - The updated post content
 * - mediaIds: string[] - Array of media attachment IDs
 */
export async function PUT(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        attachments: true,
        competitionEntries: {
          include: {
            round: {
              include: {
                competition: true
              }
            }
          }
        }
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { content, mediaIds } = await req.json();
    const validatedData = createPostSchema.parse({ content, mediaIds });

    // Check if this post is part of a competition with a default hashtag
    let updatedContent = validatedData.content;

    if (post.competitionEntries && post.competitionEntries.length > 0) {
      // Get the competition from the first entry
      const competition = post.competitionEntries[0]?.round?.competition;

      if (competition && competition.defaultHashtag) {
        debug.log(`PUT /api/posts/${postId}/edit - Post is part of competition with default hashtag: ${competition.defaultHashtag}`);

        // Ensure the hashtag starts with #
        const hashtag = competition.defaultHashtag.startsWith('#')
          ? competition.defaultHashtag
          : `#${competition.defaultHashtag}`;

        // Check if the hashtag is already in the content
        const hashtagRegex = new RegExp(`\\b${hashtag}\\b`, 'i');

        if (!hashtagRegex.test(updatedContent)) {
          // Add the hashtag to the content
          updatedContent = updatedContent.trim();
          if (updatedContent) {
            updatedContent = `${updatedContent} ${hashtag}`;
          } else {
            updatedContent = hashtag;
          }
          debug.log(`PUT /api/posts/${postId}/edit - Added default hashtag to content: ${updatedContent}`);
        } else {
          debug.log(`PUT /api/posts/${postId}/edit - Default hashtag already present in content`);
        }
      }
    }

    // Check if media attachments have changed
    const existingAttachmentIds = post.attachments.map(a => a.id);
    const newAttachmentIds = validatedData.mediaIds;

    // Sort arrays to ensure consistent comparison
    const sortedExisting = [...existingAttachmentIds].sort();
    const sortedNew = [...newAttachmentIds].sort();

    // Check if arrays have the same length and same elements
    const mediaChanged = sortedExisting.length !== sortedNew.length ||
      sortedExisting.some((id, index) => id !== sortedNew[index]);

    debug.log(`PUT /api/posts/${postId}/edit - Media attachments changed: ${mediaChanged}`);
    debug.log(`PUT /api/posts/${postId}/edit - Existing attachments: ${existingAttachmentIds.join(', ')}`);
    debug.log(`PUT /api/posts/${postId}/edit - New attachments: ${newAttachmentIds.join(', ')}`);

    // Update the post and competition entries in a transaction to ensure consistency
    const updatedPost = await prisma.$transaction(async (tx) => {
      // First update the post
      const updated = await tx.post.update({
        where: { id: postId },
        data: {
          content: updatedContent,
          // Only update attachments if they've changed
          ...(mediaChanged ? {
            attachments: {
              // Disconnect all existing attachments
              disconnect: post.attachments.map(attachment => ({ id: attachment.id })),
              // Connect new attachments
              connect: validatedData.mediaIds.map(id => ({ id })),
            },
          } : {}),
        },
        include: getPostDataInclude(user.id),
      });

      // If this post is part of a competition, ensure the entry flags are properly set
      if (post.competitionEntries && post.competitionEntries.length > 0) {
        // Update all competition entries for this post to ensure they're visible in all feeds
        await tx.competitionRoundEntry.updateMany({
          where: { postId },
          data: {
            visibleInCompetitionFeed: true,
            visibleInNormalFeed: true,
            updatedAt: new Date()
          }
        });

        debug.log(`PUT /api/posts/${postId}/edit - Updated competition entries to ensure visibility`);
      }

      return updated;
    });

    return Response.json(updatedPost);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
