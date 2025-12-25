import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function POST(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    debug.log(`POST /api/competitions/${params.competitionId}/submit-post - Starting request`);
    const { user } = await validateRequest();

    if (!user) {
      debug.log(`POST /api/competitions/${params.competitionId}/submit-post - Unauthorized request`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log(`POST /api/competitions/${params.competitionId}/submit-post - User authenticated: ${user.id}`);

    const { competitionId } = params;
    let content, mediaIds, roundId;

    try {
      const body = await req.json();
      content = body.content;
      mediaIds = body.mediaIds;
      roundId = body.roundId;
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Request body parsed:`, { roundId, mediaIdsCount: mediaIds?.length });
    } catch (parseError) {
      debug.error(`POST /api/competitions/${competitionId}/submit-post - Failed to parse request body:`, parseError);
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!roundId) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Missing roundId`);
      return Response.json({
        error: "Round ID is required"
      }, { status: 400 });
    }

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Missing or invalid mediaIds`);
      return Response.json({
        error: "At least one media attachment is required"
      }, { status: 400 });
    }

    // Competition entries can only have one media file
    if (mediaIds.length > 1) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Too many media files: ${mediaIds.length}`);
      return Response.json({
        error: "You can only submit one file per competition entry"
      }, { status: 400 });
    }

    // Verify that the media IDs exist in the database
    const mediaItems = await prisma.media.findMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (mediaItems.length === 0) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - No valid media found for IDs: ${mediaIds.join(', ')}`);
      return Response.json({ error: "No valid media found" }, { status: 400 });
    }

    if (mediaItems.length !== mediaIds.length) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Some media IDs not found. Requested: ${mediaIds.length}, Found: ${mediaItems.length}`);
      return Response.json({ error: "One or more media items not found" }, { status: 400 });
    }

    // Content is now optional
    let postContent = content || "";

    // Check if the competition exists and is active
    debug.log(`POST /api/competitions/${competitionId}/submit-post - Looking up competition`);
    const competition = await prisma.competition.findUnique({
      where: {
        id: competitionId,
        isActive: true,
      },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!competition) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Competition not found or not active`);
      return Response.json({ error: "Competition not found or not active" }, { status: 404 });
    }

    debug.log(`POST /api/competitions/${competitionId}/submit-post - Found competition: ${competition.title}`);
    debug.log(`POST /api/competitions/${competitionId}/submit-post - Competition has ${competition.rounds.length} rounds`);

    // Add default hashtag if it exists
    if (competition.defaultHashtag) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Adding default hashtag: ${competition.defaultHashtag}`);

      // Check if the hashtag is already in the content
      const hashtag = competition.defaultHashtag.startsWith('#')
        ? competition.defaultHashtag
        : `#${competition.defaultHashtag}`;

      // Use regex to check if the hashtag is already in the content
      const hashtagRegex = new RegExp(`\\b${hashtag}\\b`, 'i');

      if (!hashtagRegex.test(postContent)) {
        // Add the hashtag to the content
        postContent = postContent.trim();
        if (postContent) {
          postContent = `${postContent} ${hashtag}`;
        } else {
          postContent = hashtag;
        }
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Content with hashtag: ${postContent}`);
      } else {
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Hashtag already present in content`);
      }
    }

    // Check if the competition is completed (all rounds have ended)
    const currentDate = new Date();
    const allRoundsEnded = competition.rounds.every(round =>
      new Date(round.endDate) < currentDate
    );

    if (allRoundsEnded) {
      return Response.json({ error: "This competition is completed. You can no longer submit posts." }, { status: 400 });
    }

    // Check if the round exists and belongs to this competition
    const round = await prisma.competitionRound.findUnique({
      where: {
        id: roundId,
        competitionId,
      },
    });

    if (!round) {
      return Response.json({ error: "Round not found or not part of this competition" }, { status: 404 });
    }

    // Check if the user is a participant
    let participant;
    try {
      participant = await prisma.competitionParticipant.findUnique({
        where: {
          userId_competitionId: {
            userId: user.id,
            competitionId,
          },
        },
        include: {
          // Include current round information
          roundEntries: {
            where: {
              roundId: { not: roundId }, // Get entries for other rounds
              qualifiedForNextRound: false, // Check if disqualified in any previous round
            },
          },
        },
      });
    } catch (error) {
      // If there's an error with the schema (missing column), try a more basic query
      if (error instanceof Error && error.message.includes('hasAppealedDisqualification')) {
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Using fallback query due to schema issue`);

        // Use a raw query to get just the ID
        const participants = await prisma.$queryRaw`
          SELECT id, "userId", "competitionId", "isDisqualified"
          FROM competition_participants
          WHERE "userId" = ${user.id} AND "competitionId" = ${competitionId}
        `;

        if (participants && Array.isArray(participants) && participants.length > 0) {
          participant = participants[0];
        }
      } else {
        // If it's some other error, rethrow it
        throw error;
      }
    }

    if (!participant) {
      return Response.json({
        error: "You must join the competition before submitting a post"
      }, { status: 400 });
    }

    // Get the round index to determine if this is a later round
    const roundIndex = competition.rounds.findIndex(r => r.id === roundId);

    // Variable to track if the user is disqualified
    let isDisqualified = false;

    // If this is not the first round, check the user's qualification status
    if (roundIndex > 0) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Checking qualification for round ${roundIndex + 1}`);

      // Get all previous round IDs
      const previousRoundIds = competition.rounds
        .slice(0, roundIndex)
        .map(r => r.id);

      // Check qualification status for all previous rounds
      // We need to check all previous rounds to find if the user was disqualified in any of them
      const disqualifiedEntries = await prisma.competitionRoundEntry.findMany({
        where: {
          participantId: participant.id,
          roundId: { in: previousRoundIds },
          qualifiedForNextRound: false, // Check if disqualified
        },
        include: {
          round: true,
        },
        orderBy: {
          round: {
            startDate: 'desc',
          },
        },
      });

      // If the user was disqualified in any previous round, mark them as disqualified
      // but still allow them to submit a post (it will only be visible in the regular feed)
      if (disqualifiedEntries.length > 0) {
        isDisqualified = true;
        debug.log(`POST /api/competitions/${competitionId}/submit-post - User was disqualified in a previous round, post will only be visible in normal feed`);
      }
    }

    // Check if the round has started
    // Using the currentDate already defined above
    const roundStarted = new Date(round.startDate) <= currentDate;
    const roundEnded = new Date(round.endDate) < currentDate;

    // Check if the user already has an entry for this round
    const existingEntry = await prisma.competitionRoundEntry.findUnique({
      where: {
        participantId_roundId: {
          participantId: participant.id,
          roundId,
        },
      },
      include: {
        post: true,
      },
    });

    // If round has started and user already has a post, they can't change it
    if (roundStarted && existingEntry?.post) {
      return Response.json({
        error: "You cannot change your post after the round has started"
      }, { status: 400 });
    }

    // If round has ended and user doesn't have a post, they can't submit one
    if (roundEnded && !existingEntry?.post) {
      return Response.json({
        error: "This round has ended. You can no longer submit a post."
      }, { status: 400 });
    }

    // We already have mediaItems from earlier, no need to query again
    debug.log(`POST /api/competitions/${competitionId}/submit-post - Using previously fetched media items`);

    // Just a sanity check in case something went wrong
    if (mediaItems.length === 0) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - No valid media found in the second check`);
      return Response.json({ error: "No valid media found" }, { status: 400 });
    }

    // Check if the media type matches the competition requirements
    if (competition.mediaType === 'IMAGE_ONLY' && mediaItems.some(media => media.type === 'VIDEO')) {
      return Response.json({ error: "This competition only accepts images" }, { status: 400 });
    }

    if (competition.mediaType === 'VIDEO_ONLY' && mediaItems.some(media => media.type === 'IMAGE')) {
      return Response.json({ error: "This competition only accepts videos" }, { status: 400 });
    }

    // Check video duration if applicable
    if (competition.maxDuration && mediaItems.some(media => media.type === 'VIDEO')) {
      // Get detailed media information including duration
      const videoMedia = await prisma.media.findFirst({
        where: {
          id: {
            in: mediaIds,
          },
          type: 'VIDEO',
        },
        select: {
          id: true,
          duration: true,
        },
      });

      if (videoMedia && videoMedia.duration) {
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Video duration: ${videoMedia.duration} seconds, max allowed: ${competition.maxDuration} seconds`);

        if (videoMedia.duration > competition.maxDuration) {
          return Response.json({
            error: `Video duration (${Math.round(videoMedia.duration)} seconds) exceeds the maximum allowed duration (${competition.maxDuration} seconds) for this competition`
          }, { status: 400 });
        }
      } else {
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Could not determine video duration`);
      }
    }

    // Create a new post
    debug.log(`POST /api/competitions/${competitionId}/submit-post - Creating new post`);
    let newPost;
    try {
      newPost = await prisma.post.create({
        data: {
          content: postContent,
          userId: user.id,
          attachments: {
            connect: mediaIds.map((id: string) => ({ id })),
          },
        },
        include: getPostDataInclude(user.id),
      });
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Post created with ID: ${newPost.id}`);
    } catch (createError) {
      debug.error(`POST /api/competitions/${competitionId}/submit-post - Error creating post:`, createError);
      return Response.json({
        error: "Failed to create post",
        details: createError instanceof Error ? createError.message : "Unknown error"
      }, { status: 500 });
    }

    // If there's an existing entry, update it with the new post
    if (existingEntry) {
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Updating existing entry: ${existingEntry.id}`);
      try {
        // If there was a previous post, check if it's used in other entries before deleting
        if (existingEntry.postId) {
          debug.log(`POST /api/competitions/${competitionId}/submit-post - Checking if post ${existingEntry.postId} is used elsewhere`);

          // Check if this post is used in other competition entries
          const otherEntries = await prisma.competitionRoundEntry.findMany({
            where: {
              postId: existingEntry.postId,
              id: { not: existingEntry.id } // Exclude the current entry
            }
          });

          debug.log(`POST /api/competitions/${competitionId}/submit-post - Found ${otherEntries.length} other entries using the same post`);

          // Only delete the post if it's not used elsewhere
          if (otherEntries.length === 0) {
            debug.log(`POST /api/competitions/${competitionId}/submit-post - Deleting previous post: ${existingEntry.postId}`);
            await prisma.post.delete({
              where: {
                id: existingEntry.postId,
              },
            });
          } else {
            debug.log(`POST /api/competitions/${competitionId}/submit-post - Not deleting post ${existingEntry.postId} as it's used in ${otherEntries.length} other entries`);
          }
        }

        // For round 1 or qualified participants, make visible in both feeds
        // For disqualified participants in later rounds, we need to handle differently:
        // - If this is the round they're submitting to, it should be visible in the competition feed
        // - If this is a round after they were disqualified, it should only be visible in the normal feed

        // Default visibility settings
        let visibleInCompetitionFeed = true; // Default to visible in competition feed
        let visibleInNormalFeed = true; // Always visible in normal feed

        // If this is not the first round, check if the user was disqualified in any previous round
        if (roundIndex > 0) {
          // Get all previous round IDs
          const previousRoundIds = competition.rounds
            .slice(0, roundIndex)
            .map(r => r.id);

          // Find any round where the user was disqualified
          const disqualificationRound = await prisma.competitionRoundEntry.findFirst({
            where: {
              participantId: participant.id,
              roundId: { in: previousRoundIds },
              qualifiedForNextRound: false,
            },
            include: {
              round: true,
            },
            orderBy: {
              round: {
                startDate: 'desc',
              },
            },
          });

          if (disqualificationRound) {
            // Get the index of the disqualification round
            const disqualificationRoundIndex = competition.rounds.findIndex(r => r.id === disqualificationRound.roundId);

            // If this round is after the disqualification round, it should not be visible in the competition feed
            if (roundIndex > disqualificationRoundIndex) {
              visibleInCompetitionFeed = false;
              debug.log(`POST /api/competitions/${competitionId}/submit-post - User was disqualified in round ${disqualificationRoundIndex + 1}, this is round ${roundIndex + 1}, post will only be visible in normal feed`);
            } else {
              debug.log(`POST /api/competitions/${competitionId}/submit-post - User was disqualified in round ${disqualificationRoundIndex + 1}, but this is round ${roundIndex + 1}, post will be visible in both feeds`);
            }
          }
        }

        // Update the entry with the new post
        await prisma.competitionRoundEntry.update({
          where: {
            id: existingEntry.id,
          },
          data: {
            postId: newPost.id,
            updatedAt: new Date(),
            visibleInNormalFeed,
            visibleInCompetitionFeed,
          },
        });
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Entry updated successfully with visibleInNormalFeed=${visibleInNormalFeed} and visibleInCompetitionFeed=${visibleInCompetitionFeed}`);
      } catch (updateError) {
        debug.error(`POST /api/competitions/${competitionId}/submit-post - Error updating entry:`, updateError);
        // Try to clean up the post we just created since the update failed
        try {
          await prisma.post.delete({ where: { id: newPost.id } });
        } catch (cleanupError) {
          debug.error(`POST /api/competitions/${competitionId}/submit-post - Error cleaning up post:`, cleanupError);
        }
        return Response.json({ error: "Failed to update competition entry" }, { status: 500 });
      }
    } else {
      // Create a new entry for this round
      debug.log(`POST /api/competitions/${competitionId}/submit-post - Creating new entry for round: ${roundId}`);
      try {
        // For round 1 or qualified participants, make visible in both feeds
        // For disqualified participants in later rounds, we need to handle differently:
        // - If this is the round they're submitting to, it should be visible in the competition feed
        // - If this is a round after they were disqualified, it should only be visible in the normal feed

        // Default visibility settings
        let visibleInCompetitionFeed = true; // Default to visible in competition feed
        let visibleInNormalFeed = true; // Always visible in normal feed

        // If this is not the first round, check if the user was disqualified in any previous round
        if (roundIndex > 0) {
          // Get all previous round IDs
          const previousRoundIds = competition.rounds
            .slice(0, roundIndex)
            .map(r => r.id);

          // Find any round where the user was disqualified
          const disqualificationRound = await prisma.competitionRoundEntry.findFirst({
            where: {
              participantId: participant.id,
              roundId: { in: previousRoundIds },
              qualifiedForNextRound: false,
            },
            include: {
              round: true,
            },
            orderBy: {
              round: {
                startDate: 'desc',
              },
            },
          });

          if (disqualificationRound) {
            // Get the index of the disqualification round
            const disqualificationRoundIndex = competition.rounds.findIndex(r => r.id === disqualificationRound.roundId);

            // If this round is after the disqualification round, it should not be visible in the competition feed
            if (roundIndex > disqualificationRoundIndex) {
              visibleInCompetitionFeed = false;
              debug.log(`POST /api/competitions/${competitionId}/submit-post - User was disqualified in round ${disqualificationRoundIndex + 1}, this is round ${roundIndex + 1}, post will only be visible in normal feed`);
            } else {
              debug.log(`POST /api/competitions/${competitionId}/submit-post - User was disqualified in round ${disqualificationRoundIndex + 1}, but this is round ${roundIndex + 1}, post will be visible in both feeds`);
            }
          }
        }

        await prisma.competitionRoundEntry.create({
          data: {
            participantId: participant.id,
            roundId,
            postId: newPost.id,
            visibleInNormalFeed,
            visibleInCompetitionFeed,
          },
        });
        debug.log(`POST /api/competitions/${competitionId}/submit-post - Entry created successfully with visibleInNormalFeed=${visibleInNormalFeed} and visibleInCompetitionFeed=${visibleInCompetitionFeed}`);
      } catch (createEntryError) {
        debug.error(`POST /api/competitions/${competitionId}/submit-post - Error creating entry:`, createEntryError);
        // Try to clean up the post we just created since the entry creation failed
        try {
          await prisma.post.delete({ where: { id: newPost.id } });
        } catch (cleanupError) {
          debug.error(`POST /api/competitions/${competitionId}/submit-post - Error cleaning up post:`, cleanupError);
        }
        return Response.json({ error: "Failed to create competition entry" }, { status: 500 });
      }
    }

    debug.log(`POST /api/competitions/${competitionId}/submit-post - Request completed successfully`);
    return Response.json({
      success: true,
      message: "Post submitted to competition round successfully",
      post: newPost,
    });
  } catch (error) {
    debug.error(`POST /api/competitions/${params.competitionId}/submit-post - Unhandled error:`, error);
    // Log detailed error information
    if (error instanceof Error) {
      debug.error(`Error name: ${error.name}`);
      debug.error(`Error message: ${error.message}`);
      debug.error(`Error stack: ${error.stack}`);
    }
    return Response.json(
      {
        error: "Failed to submit post to competition",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
