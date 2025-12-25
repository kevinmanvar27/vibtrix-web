import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(req: NextRequest) {
  try {
    debug.log('GET /api/posts/competition-feed - Starting request');
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const competitionId = req.nextUrl.searchParams.get("competitionId");
    const roundId = req.nextUrl.searchParams.get("roundId");
    // Get the random parameter from the request
    const randomParam = req.nextUrl.searchParams.get("random");
    // Convert to boolean (default to false if not provided)
    const random = randomParam === "true";

    debug.log(`GET /api/posts/competition-feed - Parameters: competitionId=${competitionId}, roundId=${roundId}, cursor=${cursor}, random=${random}`);

    const pageSize = 10;

    const { user } = await validateRequest();
    const isLoggedIn = !!user;

    // For guest users, we'll still show the competition feed
    // but with limited functionality
    debug.log(`GET /api/posts/competition-feed - User authenticated: ${isLoggedIn ? user.id : 'Guest user'}`);

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      debug.error('Database connection error:', dbError);
      return Response.json({
        error: "Database connection error",
        details: dbError instanceof Error ? dbError.message : "Could not connect to database"
      }, { status: 503 });
    }

    try {
      // Get the competition
      debug.log(`GET /api/posts/competition-feed - Fetching competition: ${competitionId}`);
      const competition = competitionId ? await prisma.competition.findUnique({
        where: { id: competitionId },
        select: {
          id: true,
          title: true,
          isActive: true,
          completionReason: true,
          showStickeredMedia: true,
          rounds: {
            orderBy: {
              startDate: 'asc',
            },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              likesToPass: true,
            }
          },
        },
      }) : null;

      if (competitionId && !competition) {
        debug.log(`GET /api/posts/competition-feed - Competition not found: ${competitionId}`);
        return Response.json({ error: "Competition not found" }, { status: 404 });
      }

      debug.log(`GET /api/posts/competition-feed - Competition found: ${competition?.title}`);

      // CHECK CONDITIONS: Terminate competition if needed
      const currentDate = new Date();
      if (competition && competition.isActive && !competition.completionReason && competition.rounds.length > 0) {

        // CONDITION 1: first_round_end_date_time < current_time && total_participants < 1
        const firstRound = competition.rounds[0];
        const firstRoundEnded = new Date(firstRound.endDate) < currentDate;

        if (firstRoundEnded) {
          const participantCount = await prisma.competitionParticipant.count({
            where: { competitionId: competition.id }
          });

          debug.log(`Competition ${competition.id} feed check: firstRoundEnded=${firstRoundEnded}, participants=${participantCount}`);

          if (participantCount < 1) {
            debug.log(`Terminating competition ${competition.id} from feed - no participants joined`);

            const completionReason = "No one joined this competition, that's why it ended.";

            await prisma.competition.update({
              where: { id: competition.id },
              data: {
                completionReason,
                isActive: false,
              },
            });

            // Make all competition posts visible in normal feed
            await prisma.competitionRoundEntry.updateMany({
              where: {
                round: {
                  competitionId: competition.id,
                },
                postId: { not: null },
              },
              data: {
                visibleInNormalFeed: true,
              },
            });

            // Update the competition object
            competition.completionReason = completionReason;
            competition.isActive = false;

            debug.log(`Competition ${competition.id} terminated from feed successfully - no participants`);
          }
        }

        // CONDITION 2: round_end_date_time < current_time && participants > 0 && no_participant_got_required_likes
        if (competition.isActive && !competition.completionReason) {
          for (const round of competition.rounds) {
            const roundEnded = new Date(round.endDate) < currentDate;
            const likesToPass = round.likesToPass || 0;

            if (roundEnded && likesToPass > 0) {
              // Check if any participant got required likes in this round
              const entriesWithPosts = await prisma.competitionRoundEntry.findMany({
                where: {
                  roundId: round.id,
                  postId: { not: null }
                },
                include: {
                  post: {
                    include: {
                      _count: {
                        select: { likes: true }
                      }
                    }
                  }
                }
              });

              const entriesWithRequiredLikes = entriesWithPosts.filter(entry =>
                entry.post && entry.post._count.likes >= likesToPass
              ).length;

              const totalEntriesInRound = entriesWithPosts.length;

              debug.log(`Feed - Round ${round.name} check: ended=${roundEnded}, totalEntries=${totalEntriesInRound}, entriesWithRequiredLikes=${entriesWithRequiredLikes}, likesToPass=${likesToPass}`);

              // If round ended, has entries, but no one got required likes
              if (totalEntriesInRound > 0 && entriesWithRequiredLikes === 0) {
                debug.log(`Terminating competition ${competition.id} from feed - no participants got required likes in ${round.name}`);

                const completionReason = `${round.name} required ${likesToPass} likes but no participant achieved this target, so the competition has been ended.`;

                await prisma.competition.update({
                  where: { id: competition.id },
                  data: {
                    completionReason,
                    isActive: false,
                  },
                });

                // Make all competition posts visible in normal feed
                await prisma.competitionRoundEntry.updateMany({
                  where: {
                    round: {
                      competitionId: competition.id,
                    },
                    postId: { not: null },
                  },
                  data: {
                    visibleInNormalFeed: true,
                  },
                });

                // Update the competition object
                competition.completionReason = completionReason;
                competition.isActive = false;

                debug.log(`Competition ${competition.id} terminated from feed successfully - no qualifying participants in ${round.name}`);
                break; // Exit the loop since competition is terminated
              }
            }
          }
        }
      }

      // Determine if the competition is active or completed
      const isCompetitionActive = competition && competition.rounds.some(round =>
        new Date(round.startDate) <= currentDate && new Date(round.endDate) >= currentDate
      );

      const isCompetitionCompleted = competition && competition.rounds.every(round =>
        new Date(round.endDate) < currentDate
      );

      // Check if any round has started (even if it's already completed)
      const anyRoundStarted = competition && competition.rounds.some(round =>
        new Date(round.startDate) <= currentDate
      );

      // Find the current active round if competition is active
      const currentRound = isCompetitionActive ? competition?.rounds.find(round =>
        new Date(round.startDate) <= currentDate && new Date(round.endDate) >= currentDate
      ) : null;

      // If no current round exists but there are completed rounds, use the most recently completed round
      const mostRecentCompletedRound = !currentRound && anyRoundStarted ?
        competition?.rounds
          .filter(round => new Date(round.endDate) < currentDate)
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
        : null;

      // If roundId is specified, use that instead of the current round or most recently completed round
      const targetRoundId = roundId || currentRound?.id || mostRecentCompletedRound?.id;

      // Build the query based on competition status
      let whereClause: any = {};

      if (competitionId && competition) {
        debug.log(`Competition status: active=${isCompetitionActive}, completed=${isCompetitionCompleted}, terminated=${!competition.isActive && !!competition.completionReason}`);

        // SPECIAL HANDLING FOR TERMINATED COMPETITIONS
        if (!competition.isActive && competition.completionReason) {
          debug.log(`Competition is terminated: ${competition.completionReason}`);

          // For terminated competitions, only show posts from rounds that actually happened
          // Find the round where termination occurred
          let allowedRoundIds = [];

          for (const round of competition.rounds) {
            const roundStarted = new Date(round.startDate) <= currentDate;
            if (roundStarted) {
              allowedRoundIds.push(round.id);
              debug.log(`Including round ${round.name} (${round.id}) - round had started`);
            } else {
              debug.log(`Excluding round ${round.name} (${round.id}) - round never started`);
              break; // Stop at first round that never started
            }
          }

          debug.log(`Terminated competition - showing posts from ${allowedRoundIds.length} rounds:`, allowedRoundIds);

          if (roundId && allowedRoundIds.includes(roundId)) {
            // Show specific round (if it's an allowed round)
            whereClause = {
              competitionEntries: {
                some: {
                  roundId: roundId,
                  postId: { not: null },
                  visibleInCompetitionFeed: true,
                },
              },
            };
            debug.log(`Terminated competition - showing specific round: ${roundId}`);
          } else if (!roundId && allowedRoundIds.length > 0) {
            // Show all allowed rounds
            whereClause = {
              competitionEntries: {
                some: {
                  roundId: { in: allowedRoundIds },
                  postId: { not: null },
                  visibleInCompetitionFeed: true,
                },
              },
            };
            debug.log(`Terminated competition - showing all allowed rounds`);
          } else {
            // No posts to show
            whereClause = { id: "never-match" };
            debug.log(`Terminated competition - no posts to show`);
          }
        } else if (isCompetitionActive || isCompetitionCompleted || anyRoundStarted) {
          // Simplified query to get all posts for this competition
          // We'll check for visibleInCompetitionFeed and specific round if needed
          // Get all completed round IDs for reference
          const completedRoundIds = competition.rounds
            .filter(round => new Date(round.endDate) < currentDate)
            .map(round => round.id);

          debug.log(`Completed round IDs: ${JSON.stringify(completedRoundIds)}`);
          debug.log(`Current date: ${currentDate.toISOString()}`);

          if (roundId) {
            // If a specific round is selected, show only posts from that round
            // Ensure posts were specifically created for this competition
            // For round-specific queries, be more inclusive to show all posts for that round
            const roundDetails = competition.rounds.find(r => r.id === roundId);
            const roundStarted = roundDetails ? new Date(roundDetails.startDate) <= new Date() : false;

            whereClause = {
              competitionEntries: {
                some: {
                  round: {
                    competitionId,
                    id: roundId, // Ensure we're getting the exact round
                  },
                  roundId: roundId,
                  // Make sure the post exists
                  postId: { not: null },
                  // Show posts if they're visible OR if the round has started (more inclusive for round 3)
                  OR: [
                    { visibleInCompetitionFeed: true },
                    ...(roundStarted ? [{
                      participant: {
                        isDisqualified: false
                      }
                    }] : [])
                  ],
                },
              },
            };

            debug.log(`Using specific round query for round: ${roundId} (${roundDetails?.name || 'Unknown round'})`);
            debug.log(`Round start date: ${roundDetails?.startDate}, end date: ${roundDetails?.endDate}`);
          } else {
            // Show all posts from the competition
            // For "All Rounds" tab, we want to show posts from all completed rounds

            if (completedRoundIds.length > 0) {
              // If there are completed rounds, show posts from those rounds
              // Use a more direct approach to query posts from completed rounds
              whereClause = {
                competitionEntries: {
                  some: {
                    roundId: { in: completedRoundIds },
                    // Make sure the post exists
                    postId: { not: null },
                    // Only show posts from qualified participants
                    visibleInCompetitionFeed: true,
                  },
                },
              };

              // Log the round IDs we're querying for
              debug.log('Querying for posts in these completed round IDs:', completedRoundIds);
              debug.log(`Using query for ${completedRoundIds.length} completed rounds in "All" tab`);
            } else {
              // If no completed rounds, show posts from all started rounds
              whereClause = {
                competitionEntries: {
                  some: {
                    round: {
                      competitionId,
                      // Only show posts for rounds that have started
                      startDate: { lte: new Date() },
                    },
                    // Make sure the post exists
                    postId: { not: null },
                    // Only show posts from qualified participants
                    visibleInCompetitionFeed: true,
                  },
                },
              };
              debug.log('No completed rounds found, showing all started rounds');
            }
            debug.log(`Competition status: active=${isCompetitionActive}, completed=${isCompetitionCompleted}, anyRoundStarted=${anyRoundStarted}`);
          }
        } else {
          // Competition hasn't started yet or no valid round
          debug.log('Competition has not started yet');
          return Response.json({
            posts: [],
            nextCursor: null,
            message: "No posts available for this competition yet"
          });
        }
      } else {
        // If no competition is specified, return an empty result
        return Response.json({
          posts: [],
          nextCursor: null,
          message: "No competition specified"
        });
      }

      debug.log('GET /api/posts/competition-feed - Query where clause:', JSON.stringify(whereClause, null, 2));

      // Rounds information is already logged in debug.log above

      // Log the query we're about to execute
      debug.log('Executing Prisma query with where clause:', JSON.stringify(whereClause, null, 2));

      try {
        // Try to count posts first to see if we have any matches
        const postCount = await prisma.post.count({
          where: whereClause,
        });

        debug.log(`Found ${postCount} posts matching the query criteria`);

        // If we're querying for a specific round, check if there are any entries for this round
        if (roundId) {
          const entriesCount = await prisma.competitionRoundEntry.count({
            where: {
              roundId: roundId,
              postId: { not: null },
            },
          });

          debug.log(`Found ${entriesCount} entries with posts for round ${roundId}`);

          // Check if there are any participants for this round
          const participantsCount = await prisma.competitionParticipant.count({
            where: {
              competitionId,
              roundEntries: {
                some: {
                  roundId: roundId,
                }
              }
            },
          });

          debug.log(`Found ${participantsCount} participants for this competition`);

          // If there are participants but no posts, we need to check if they've uploaded anything
          if (participantsCount > 0 && entriesCount === 0) {
            debug.log(`There are participants but no posts for round ${roundId}. Participants may not have uploaded content yet.`);
          }
        }

        // If random is true, we need to get all posts and then randomize them
        let posts;

        if (random) {
          // For random ordering, we need to get all eligible posts first
          const allPosts = await prisma.post.findMany({
            where: {
              ...whereClause,
              user: {
                role: "USER"
              }
            },
            include: getPostDataInclude(isLoggedIn ? user.id : ''),
            orderBy: { createdAt: "desc" },
            // Don't use cursor or pagination for random posts
          });

          // Shuffle the posts randomly
          const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);

          // Take only the number of posts we need
          posts = shuffledPosts.slice(0, pageSize + 1);

          debug.log(`GET /api/posts/competition-feed - Randomized ${allPosts.length} posts, returning ${posts.length}`);
        } else {
          // Add filter to only show posts from users with role "USER"
          posts = await prisma.post.findMany({
            where: {
              ...whereClause,
              user: {
                role: "USER"
              }
            },
            include: getPostDataInclude(isLoggedIn ? user.id : ''),
            orderBy: { createdAt: "desc" },
            take: pageSize + 1,
            cursor: cursor ? { id: cursor } : undefined,
          });
        }

        // Log the IDs of the posts we found
        debug.log('Post IDs found:', posts.map(p => p.id));

        debug.log(`GET /api/posts/competition-feed - Found ${posts.length} posts`);

        const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

        // Process media URLs based on competition's showStickeredMedia setting
        const processedPosts = posts.slice(0, pageSize).map(post => {
          // If showStickeredMedia is false, replace stickered URLs with original URLs
          if (competition && competition.showStickeredMedia === false) {
            // Process each attachment to replace stickered URLs with original URLs
            const processedAttachments = post.attachments.map(attachment => {
              // Check if the URL is a stickered URL
              if (attachment.url && attachment.url.startsWith('/uploads/stickered/')) {
                // For videos, we need to be more careful as the original might not exist
                if (attachment.type === 'VIDEO') {
                  // Check if the original file exists
                  const originalUrl = attachment.url.replace('/uploads/stickered/', '/uploads/original/');
                  const originalFilePath = require('path').join(process.cwd(), 'public', originalUrl);

                  if (require('fs').existsSync(originalFilePath)) {
                    // Original file exists, use it
                    debug.log(`Found original video at ${originalFilePath}, using it instead of stickered version`);
                    return { ...attachment, url: originalUrl };
                  } else {
                    // Original file doesn't exist, keep using the stickered version
                    debug.log(`Original video not found at ${originalFilePath}, keeping stickered version`);
                    return attachment;
                  }
                } else {
                  // For images, replace 'stickered' with 'original' in the URL path
                  const originalUrl = attachment.url.replace('/uploads/stickered/', '/uploads/original/');
                  return { ...attachment, url: originalUrl };
                }
              }
              return attachment;
            });

            return { ...post, attachments: processedAttachments };
          }

          return post;
        });

        const data: PostsPage = {
          posts: processedPosts,
          nextCursor,
        };

        debug.log(`GET /api/posts/competition-feed - Returning ${data.posts.length} posts with showStickeredMedia=${competition?.showStickeredMedia}`);
        return Response.json(data);
      } catch (error) {
        debug.error('Error executing Prisma query:', error);
        throw error;
      }
    } catch (queryError) {
      debug.error('Error querying competition posts:', queryError);
      return Response.json({
        error: "Failed to fetch competition posts",
        details: queryError instanceof Error ? queryError.message : "Error querying database"
      }, { status: 500 });
    }
  } catch (error) {
    debug.error('Unhandled error in competition feed API:', error);
    return Response.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    }, { status: 500 });
  }
}
