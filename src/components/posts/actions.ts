"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";

import debug from "@/lib/debug";

export async function deletePost(id: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      attachments: {
        include: {
          appliedPromotionSticker: true
        }
      },
      competitionEntries: {
        include: {
          round: true
        }
      }
    }
  });

  if (!post) throw new Error("Post not found");

  if (post.userId !== user.id) throw new Error("Unauthorized");

  // Check if the post is part of a competition round that has started
  const currentDate = new Date();
  const isPartOfStartedRound = post.competitionEntries.some(entry =>
    entry.round && new Date(entry.round.startDate) <= currentDate
  );

  if (isPartOfStartedRound) {
    throw new Error("This post cannot be deleted because it is part of a competition round that has already started.");
  }

  // Handle sticker usage for each attachment with a sticker using a transaction
  await prisma.$transaction(async (tx) => {
    for (const attachment of post.attachments) {
      if (attachment.appliedPromotionStickerId) {
        debug.log(`Post deletion: Processing sticker ${attachment.appliedPromotionStickerId} for media ${attachment.url}`);

        // Update the sticker usage record
        const updateResult = await tx.stickerUsage.updateMany({
          where: {
            stickerId: attachment.appliedPromotionStickerId,
            mediaUrl: attachment.url,
            isDeleted: false
          },
          data: {
            isDeleted: true,
            updatedAt: new Date()
          }
        });

        debug.log(`Post deletion: Updated ${updateResult.count} sticker usage records`);

        // We no longer need to increment the sticker limit
        // The StickerUsage record with isDeleted=true is sufficient to track this
      }
    }

    // Handle competition entries if they exist
    if (post.competitionEntries.length > 0) {
      debug.log(`Post deletion: Handling ${post.competitionEntries.length} competition entries`);

      // Update each entry to remove the post reference instead of deleting the post
      for (const entry of post.competitionEntries) {
        await tx.competitionRoundEntry.update({
          where: { id: entry.id },
          data: {
            postId: null,
            visibleInCompetitionFeed: false,
            visibleInNormalFeed: false,
            updatedAt: new Date()
          }
        });
        debug.log(`Post deletion: Updated competition entry ${entry.id} to remove post reference`);
      }
    }
  });

  const deletedPost = await prisma.post.delete({
    where: { id },
    include: getPostDataInclude(user.id),
  });

  return deletedPost;
}

export async function editPost(input: {
  id: string;
  content: string;
  mediaIds: string[];
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { id, content, mediaIds } = input;
  const validatedData = createPostSchema.parse({ content, mediaIds });

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      competitionEntries: {
        include: {
          round: true
        }
      }
    }
  });

  if (!post) throw new Error("Post not found");

  if (post.userId !== user.id) throw new Error("Unauthorized");

  // Check if the post is part of a competition round that has started
  const currentDate = new Date();
  const isPartOfStartedRound = post.competitionEntries.some(entry =>
    entry.round && new Date(entry.round.startDate) <= currentDate
  );

  if (isPartOfStartedRound) {
    throw new Error("This post cannot be edited because it is part of a competition round that has already started.");
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      content: validatedData.content,
      attachments: {
        set: validatedData.mediaIds.map(mediaId => ({ id: mediaId })),
      },
    },
    include: getPostDataInclude(user.id),
  });

  return updatedPost;
}
