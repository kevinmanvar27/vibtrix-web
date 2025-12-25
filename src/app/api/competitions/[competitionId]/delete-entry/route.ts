import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;
    const { roundId } = await req.json();

    if (!roundId) {
      return Response.json({
        error: "Round ID is required"
      }, { status: 400 });
    }

    // Check if the competition exists
    const competition = await prisma.competition.findUnique({
      where: {
        id: competitionId,
      },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Check if the round exists and belongs to this competition
    const round = await prisma.competitionRound.findUnique({
      where: {
        id: roundId,
        competitionId,
      },
    });

    if (!round) {
      return Response.json({ error: "Round not found" }, { status: 404 });
    }

    // Check if the round has started
    const currentDate = new Date();
    const roundStarted = new Date(round.startDate) <= currentDate;

    // If round has started, don't allow deletion
    if (roundStarted) {
      return Response.json({
        error: "You cannot delete your entry after the round has started"
      }, { status: 400 });
    }

    // Check if the user is a participant in this competition
    const participant = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId,
        },
      },
    });

    if (!participant) {
      return Response.json({ error: "You are not a participant in this competition" }, { status: 403 });
    }

    // Find the entry
    const entry = await prisma.competitionRoundEntry.findUnique({
      where: {
        participantId_roundId: {
          participantId: participant.id,
          roundId,
        },
      },
      include: {
        post: {
          include: {
            attachments: {
              include: {
                appliedPromotionSticker: true
              }
            }
          }
        },
      },
    });

    if (!entry) {
      return Response.json({ error: "Entry not found" }, { status: 404 });
    }

    // Handle sticker usage for each attachment with a sticker using a transaction
    if (entry.post) {
      await prisma.$transaction(async (tx) => {
        for (const attachment of entry.post!.attachments) {
          if (attachment.appliedPromotionStickerId) {
            debug.log(`Competition entry deletion: Processing sticker ${attachment.appliedPromotionStickerId} for media ${attachment.url}`);

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

            debug.log(`Competition entry deletion: Updated ${updateResult.count} sticker usage records`);

            // We no longer need to increment the sticker limit
            // The StickerUsage record with isDeleted=true is sufficient to track this
          }
        }
      });
    }

    // Check if this post is used in other competition entries
    if (entry.postId) {
      const otherEntries = await prisma.competitionRoundEntry.findMany({
        where: {
          postId: entry.postId,
          id: { not: entry.id } // Exclude the current entry
        }
      });

      debug.log(`Found ${otherEntries.length} other entries using the same post`);

      if (otherEntries.length > 0) {
        // Post is used in other entries, just update this entry to remove the post reference
        await prisma.competitionRoundEntry.update({
          where: {
            id: entry.id,
          },
          data: {
            postId: null,
            visibleInCompetitionFeed: false,
            visibleInNormalFeed: false,
          },
        });
        debug.log(`Updated entry ${entry.id} to remove post reference`);
      } else {
        // Post is not used elsewhere, safe to delete the post
        await prisma.post.delete({
          where: {
            id: entry.postId,
          },
        });
        debug.log(`Deleted post ${entry.postId}`);

        // Delete the entry
        await prisma.competitionRoundEntry.delete({
          where: {
            id: entry.id,
          },
        });
        debug.log(`Deleted entry ${entry.id}`);
      }
    } else {
      // No post associated, just delete the entry
      await prisma.competitionRoundEntry.delete({
        where: {
          id: entry.id,
        },
      });
      debug.log(`Deleted entry ${entry.id} (no post was associated);`);
    }

    return Response.json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    debug.error("Error deleting competition entry:", error);
    return Response.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
