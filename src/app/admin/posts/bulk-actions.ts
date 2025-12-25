"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";
import path from "path";
import fs from "fs";

import debug from "@/lib/debug";

/**
 * Deletes all user-uploaded posts and their associated media files
 * This is a destructive operation that cannot be undone
 * @returns A summary of the deletion operation
 */
export async function deleteAllPosts() {
  // Validate that the user is an admin
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized: Only administrators can perform this action");
  }

  debug.log("Starting bulk deletion of all posts and media files");

  // Get all posts with their attachments
  const posts = await prisma.post.findMany({
    include: {
      attachments: true,
      competitionEntries: true,
    },
  });

  debug.log(`Found ${posts.length} posts to delete`);

  // Track statistics
  const stats = {
    postsDeleted: 0,
    mediaFilesDeleted: 0,
    competitionEntriesUpdated: 0,
    errors: [] as string[],
  };

  // Process each post
  for (const post of posts) {
    try {
      // Handle media files
      if (post.attachments.length > 0) {
        for (const attachment of post.attachments) {
          try {
            // Check if the file is stored in UploadThing
            if (attachment.url.includes("utfs.io")) {
              // Delete from UploadThing
              const utapi = new UTApi();

              // Extract the key from the URL
              const key = attachment.url.split(
                `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
              )[1];

              if (key) {
                await utapi.deleteFiles(key);
                debug.log(`Deleted file from UploadThing: ${key}`);
              }
            }
            // Check if the file is stored locally
            else if (attachment.url.startsWith('/uploads/')) {
              // Delete from local file system
              const uploadDir = path.join(process.cwd(), 'public');
              const filePath = path.join(uploadDir, attachment.url);

              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                debug.log(`Deleted local file: ${filePath}`);
              }

              // Also check for and delete any additional quality versions
              if (attachment.urlHigh && attachment.urlHigh.startsWith('/uploads/')) {
                const highPath = path.join(uploadDir, attachment.urlHigh);
                if (fs.existsSync(highPath)) fs.unlinkSync(highPath);
              }

              if (attachment.urlMedium && attachment.urlMedium.startsWith('/uploads/')) {
                const mediumPath = path.join(uploadDir, attachment.urlMedium);
                if (fs.existsSync(mediumPath)) fs.unlinkSync(mediumPath);
              }

              if (attachment.urlLow && attachment.urlLow.startsWith('/uploads/')) {
                const lowPath = path.join(uploadDir, attachment.urlLow);
                if (fs.existsSync(lowPath)) fs.unlinkSync(lowPath);
              }

              if (attachment.urlThumbnail && attachment.urlThumbnail.startsWith('/uploads/')) {
                const thumbnailPath = path.join(uploadDir, attachment.urlThumbnail);
                if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
              }

              if (attachment.posterUrl && attachment.posterUrl.startsWith('/uploads/')) {
                const posterPath = path.join(uploadDir, attachment.posterUrl);
                if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
              }
            }

            stats.mediaFilesDeleted++;
          } catch (mediaError) {
            debug.error(`Error deleting media file ${attachment.id}:`, mediaError);
            stats.errors.push(`Failed to delete media file ${attachment.id}: ${mediaError instanceof Error ? mediaError.message : 'Unknown error'}`);
          }
        }
      }

      // Handle competition entries
      if (post.competitionEntries.length > 0) {
        // Get all entries that use this post
        const entries = await prisma.competitionRoundEntry.findMany({
          where: {
            postId: post.id,
          },
          include: {
            round: true,
            participant: true
          }
        });

        debug.log(`Found ${entries.length} competition entries for post ${post.id}`);

        // Group entries by participant
        const entriesByParticipant = new Map();
        entries.forEach(entry => {
          if (!entriesByParticipant.has(entry.participantId)) {
            entriesByParticipant.set(entry.participantId, []);
          }
          entriesByParticipant.get(entry.participantId).push(entry);
        });

        debug.log(`Grouped entries into ${entriesByParticipant.size} participants`);

        // For each participant, update their entries
        for (const [participantId, participantEntries] of entriesByParticipant.entries()) {
          debug.log(`Processing ${participantEntries.length} entries for participant ${participantId}`);

          // Update each entry to remove the post reference
          for (const entry of participantEntries) {
            await prisma.competitionRoundEntry.update({
              where: {
                id: entry.id,
              },
              data: {
                postId: null,
                visibleInCompetitionFeed: false,
                visibleInNormalFeed: false,
                updatedAt: new Date(),
              },
            });
            debug.log(`Updated entry ${entry.id} for round ${entry.round.name}`);
          }
        }

        stats.competitionEntriesUpdated += post.competitionEntries.length;
        debug.log(`Updated ${post.competitionEntries.length} competition entries for post ${post.id}`);
      }

      // Delete the post
      await prisma.post.delete({
        where: {
          id: post.id,
        },
      });

      stats.postsDeleted++;
      debug.log(`Deleted post ${post.id}`);
    } catch (postError) {
      debug.error(`Error processing post ${post.id}:`, postError);
      stats.errors.push(`Failed to process post ${post.id}: ${postError instanceof Error ? postError.message : 'Unknown error'}`);
    }
  }

  debug.log("Bulk deletion completed with the following results:", stats);
  return stats;
}
