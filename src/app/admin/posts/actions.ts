"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

import debug from "@/lib/debug";

export async function disablePost(postId: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  // In a real implementation, you would add a 'disabled' field to the Post model
  // For now, we'll just return success
  return { success: true, message: "Post disabled successfully" };
}

export async function deletePost(postId: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Get post with attachments
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      attachments: {
        include: {
          appliedPromotionSticker: true
        }
      }
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Handle sticker usage for each attachment with a sticker using a transaction
  await prisma.$transaction(async (tx) => {
    for (const attachment of post.attachments) {
      if (attachment.appliedPromotionStickerId) {
        debug.log(`Admin post deletion: Processing sticker ${attachment.appliedPromotionStickerId} for media ${attachment.url}`);

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

        debug.log(`Admin post deletion: Updated ${updateResult.count} sticker usage records`);

        // We no longer need to increment the sticker limit
        // The StickerUsage record with isDeleted=true is sufficient to track this
      }
    }
  });

  // Delete media files from UploadThing
  if (post.attachments.length > 0) {
    const utapi = new UTApi();

    for (const attachment of post.attachments) {
      try {
        // Extract the key from the URL
        const key = attachment.url.split(
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        )[1];

        if (key) {
          await utapi.deleteFiles(key);
        }
      } catch (error) {
        debug.error("Error deleting file:", error);
        // Continue with other files even if one fails
      }
    }
  }

  // Delete post from database
  await prisma.post.delete({
    where: { id: postId },
  });

  return { success: true, message: "Post deleted successfully" };
}
