import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CompetitionRoundInfo } from "@/components/competitions/CompetitionRoundInfo";
import { ParticipateButton } from "@/components/competitions/ParticipateButton";
import { CompetitionStickers } from "@/components/competitions/CompetitionStickers";
import { CompetitionWinners } from "@/components/competitions/CompetitionWinners";
import RoundUploadCard from "@/components/competitions/RoundUploadCard";
import PrizeDistributionCard from "@/components/competitions/PrizeDistributionCard";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import CompetitionFeedWrapper from "./CompetitionFeedWrapper";
import RoundSelector from "./RoundSelector";
import UploadPostButton from "@/components/competitions/UploadPostButton";
import TabsWithUrlSync from "./TabsWithUrlSync";
import { IndianRupee, Users, Calendar, Clock, Trophy } from "lucide-react";
import { HtmlContent } from "@/components/ui/html-content";


import debug from "@/lib/debug";

// Force dynamic rendering to avoid cache issues with competition status
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Competition Details - Vibtrix",
  description: "View competition details and participate",
};

interface CompetitionDetailsPageProps {
  params: {
    slug: string;
  };
}

async function getCompetition(id: string, userId: string) {
  try {
    debug.log(`Fetching competition details for ID: ${id}`);

    // Get the competition with all its details and participant information in a single query
    const competition = await prisma.competition.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        mediaType: true,
        minLikes: true,
        maxDuration: true,
        isActive: true,
        completionReason: true,
        minAge: true,
        maxAge: true,
        isPaid: true,
        entryFee: true,
        hasPrizes: true,
        prizes: true,
        createdAt: true,
        updatedAt: true,
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
            createdAt: true,
          },
        },
        DefaultStickers: {
          select: {
            A: true,
            B: true,
            competition_stickers: true,
          },
        },
        OptionalStickers: {
          select: {
            A: true,
            B: true,
            competition_stickers: true,
          },
        },
        participants: {
          where: {
            userId,
          },
          select: {
            id: true,
            userId: true,
            competitionId: true,
            currentRoundId: true,
            hasPaid: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!competition) {
      debug.log(`Competition not found with ID: ${id}`);
      throw new Error('Competition not found');
    }

    debug.log(`Successfully found competition: ${competition.title}`);

    // Log competition details for debugging
    debug.log(`Competition ID: ${competition.id}`);
    debug.log(`Competition Title: ${competition.title}`);
    debug.log(`Competition Rounds: ${competition.rounds.length}`);
    debug.log(`Competition Participants: ${competition._count.participants}`);


    // Filter out duplicate rounds by name
    const uniqueRoundsByName = new Map();

    // Process each round
    competition.rounds.forEach(round => {
      // If we haven't seen this round name yet, or this round is newer than the one we've seen
      if (!uniqueRoundsByName.has(round.name) ||
        new Date(round.createdAt) > new Date(uniqueRoundsByName.get(round.name).createdAt)) {
        uniqueRoundsByName.set(round.name, round);
      }
    });

    // Replace the rounds array with the filtered one
    competition.rounds = Array.from(uniqueRoundsByName.values());

    // Get participant's round entries separately to avoid duplicating rounds
    if (competition.participants.length > 0) {
      try {
        // First check if the participant exists
        const participantCheck = await prisma.competitionParticipant.findFirst({
          where: {
            userId,
            competitionId: id,
          },
          select: {
            id: true
          }
        });

        if (participantCheck) {
          debug.log(`Found participant with ID: ${participantCheck.id}`);

          // Then get the round entries with a more comprehensive query
          const roundEntries = await prisma.competitionRoundEntry.findMany({
            where: {
              participantId: participantCheck.id
            },
            include: {
              round: true,
              post: {
                include: {
                  attachments: true,
                },
              },
            },
          });

          debug.log(`Found ${roundEntries.length} round entries for participant`);

          // If we don't have entries for all rounds, make sure we create placeholder entries
          // This ensures the user sees all rounds in their "My Entries" tab
          const existingRoundIds = new Set(roundEntries.map(entry => entry.roundId));

          // Check if we're missing entries for any rounds
          const missingRoundEntries = [];
          for (const round of competition.rounds) {
            if (!existingRoundIds.has(round.id)) {
              debug.log(`Creating placeholder entry for round ${round.id} (${round.name});`);
              // Create a placeholder entry object (not saved to database)
              missingRoundEntries.push({
                id: `placeholder-${round.id}`,
                participantId: participantCheck.id,
                roundId: round.id,
                postId: null,
                post: null,
                round: round,
                createdAt: new Date(),
                updatedAt: new Date(),
                qualifiedForNextRound: null,
                visibleInCompetitionFeed: false,
                visibleInNormalFeed: false
              });
            }
          }

          // Combine existing entries with placeholder entries
          const allRoundEntries = [...roundEntries, ...missingRoundEntries];
          debug.log(`Total entries after adding placeholders: ${allRoundEntries.length}`);

          // Sort entries by round start date
          allRoundEntries.sort((a, b) => {
            return new Date(a.round.startDate).getTime() - new Date(b.round.startDate).getTime();
          });

          // Log all entries for debugging
          debug.log('All round entries after sorting:');
          allRoundEntries.forEach(entry => {
            debug.log(`Round: ${entry.round.name}, Post ID: ${entry.postId || 'None'}, Entry ID: ${entry.id}`);
          });

          // Use type assertion to add the roundEntries property with all entries
          (competition.participants[0] as any).roundEntries = allRoundEntries;
        }
      } catch (error) {
        debug.error('Error fetching participant round entries:', error);
        // Continue without round entries
        // Don't let this error prevent the page from loading
      }
    }

    return competition;
  } catch (error) {
    debug.error('Error fetching competition:', error);
    // Log detailed error information
    if (error instanceof Error) {
      debug.error(`Error name: ${error.name}`);
      debug.error(`Error message: ${error.message}`);
      debug.error(`Error stack: ${error.stack}`);
    }
    throw error; // Re-throw to be caught by the page component
  }
}

export default async function CompetitionDetailsPage({ params }: CompetitionDetailsPageProps) {
  // Add a try-catch block around the entire function to ensure it never crashes
  try {
    debug.log(`Starting competition details page for slug: ${params.slug}`);

    const { user } = await validateRequest();
    const isLoggedIn = !!user;

    // For guest users, we'll show a limited view of the competition
    // with a prompt to sign in for full access

    // First try to find by slug
    let competitionId = params.slug;
    try {
      debug.log(`Looking up competition with slug: ${params.slug}`);

      // Check if the slug is already a valid competition ID
      const competitionById = await prisma.competition.findUnique({
        where: { id: params.slug },
        select: { id: true }
      });

      if (competitionById) {
        debug.log(`Found competition directly by ID: ${params.slug}`);
        competitionId = params.slug;
      } else {
        // Try to find by slug
        const competitionBySlug = await prisma.competition.findUnique({
          where: { slug: params.slug },
          select: { id: true }
        });

        if (competitionBySlug) {
          debug.log(`Found competition by slug: ${params.slug} -> ID: ${competitionBySlug.id}`);
          competitionId = competitionBySlug.id;
        } else {
          debug.log(`No competition found with slug or ID: ${params.slug}`);
          return notFound();
        }
      }
    } catch (error) {
      debug.error(`Error looking up competition by slug/ID: ${params.slug}`, error);
      // Try a fallback approach - search for competitions with similar slugs
      try {
        debug.log(`Attempting fallback search for competition with similar slug: ${params.slug}`);
        const competitions = await prisma.competition.findMany({
          where: {
            OR: [
              { slug: { contains: params.slug } },
              { title: { contains: params.slug } }
            ]
          },
          select: { id: true, slug: true, title: true },
          take: 1
        });

        if (competitions.length > 0) {
          debug.log(`Found similar competition: ${competitions[0].title} (${competitions[0].id});`);
          competitionId = competitions[0].id;
        } else {
          debug.log(`No similar competitions found for slug: ${params.slug}`);
          return notFound();
        }
      } catch (fallbackError) {
        debug.error(`Fallback search failed for slug: ${params.slug}`, fallbackError);
        return notFound();
      }
    }

    // For guest users, we'll use an empty string as the user ID
    const userId = isLoggedIn && user ? user.id : '';
    const competition = await getCompetition(competitionId, userId);

    // CHECK CONDITIONS: Terminate competition if needed
    const currentTime = new Date();
    const firstRound = competition.rounds[0];

    if (competition.isActive && !competition.completionReason) {

      // CONDITION 1: first_round_end_date_time < current_time && total_participants < 1
      if (firstRound) {
        const firstRoundEnded = new Date(firstRound.endDate) < currentTime;
        const participantCount = competition._count.participants;

        debug.log(`Competition ${competition.id} check: firstRoundEnded=${firstRoundEnded}, participants=${participantCount}`);

        if (firstRoundEnded && participantCount < 1) {
          debug.log(`Terminating competition ${competition.id} - no participants joined`);

          const completionReason = "No one joined this competition, that's why it ended.";

          // Update competition in database
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

          // Update the competition object for immediate display
          competition.completionReason = completionReason;
          competition.isActive = false;

          debug.log(`Competition ${competition.id} terminated successfully - no participants`);
        }
      }

      // CONDITION 2: round_end_date_time < current_time && participants > 0 && no_participant_got_required_likes
      if (competition.isActive && !competition.completionReason) {
        for (const round of competition.rounds) {
          const roundEnded = new Date(round.endDate) < currentTime;
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

            debug.log(`Round ${round.name} check: ended=${roundEnded}, totalEntries=${totalEntriesInRound}, entriesWithRequiredLikes=${entriesWithRequiredLikes}, likesToPass=${likesToPass}`);

            // If round ended, has entries, but no one got required likes
            if (totalEntriesInRound > 0 && entriesWithRequiredLikes === 0) {
              debug.log(`Terminating competition ${competition.id} - no participants got required likes in ${round.name}`);

              const completionReason = `${round.name} required ${likesToPass} likes but no participant achieved this target, so the competition has been ended.`;

              // Update competition in database
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

              // Update the competition object for immediate display
              competition.completionReason = completionReason;
              competition.isActive = false;

              debug.log(`Competition ${competition.id} terminated successfully - no qualifying participants in ${round.name}`);
              break; // Exit the loop since competition is terminated
            }
          }
        }
      }
    }

    // If we get here, the competition was found

    // Check if the user is a participant
    const isParticipant = competition.participants.length > 0;

    // Check if the participant has paid (for paid competitions)
    const hasPaid = isParticipant && competition.participants[0].hasPaid;

    // Determine competition status
    const currentDate = new Date();
    let status = "Upcoming";

    // Check if the first round has completed (for join button visibility)
    // (reusing firstRound variable from above)
    const firstRoundCompleted = firstRound && new Date(firstRound.endDate) < currentDate;

    // Check if competition is inactive or has completion reason (auto-terminated)
    if (!competition.isActive || competition.completionReason) {
      status = "Completed";
    } else if (competition.rounds.length > 0) {
      // Check if any round has started
      const anyRoundStarted = competition.rounds.some(round =>
        new Date(round.startDate) <= currentDate
      );

      // Check if all rounds have ended
      const allRoundsEnded = competition.rounds.every(round =>
        new Date(round.endDate) < currentDate
      );

      if (anyRoundStarted) {
        if (allRoundsEnded) {
          status = "Completed";
        } else {
          status = "Active";
        }
      }
    }

    // Get the current round - only if competition is still active
    const currentRound = competition.isActive && !competition.completionReason
      ? competition.rounds.find(round =>
          new Date(round.startDate) <= currentDate && new Date(round.endDate) >= currentDate
        )
      : null;

    // Get the next round - only if competition is still active and no current round
    const nextRound = competition.isActive && !competition.completionReason && !currentRound
      ? competition.rounds.find(round =>
          new Date(round.startDate) > currentDate
        )
      : null;

    return (
      <div className="space-y-6">
        {/* Competition Header - Clean & Modern Design */}
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 overflow-hidden opacity-5 pointer-events-none">
            <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-gray-100 to-transparent dark:from-gray-800 dark:to-transparent"></div>
          </div>

          {/* Header Content */}
          <div className="relative p-6 md:p-8">
            {/* Title and Status Badge */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{competition.title}</h1>
              <Badge
                variant="outline"
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  status === "Active"
                    ? "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    : status === "Completed"
                      ? "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      : "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                }`}
              >
                {status === "Active" && <Clock className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                {status === "Completed" && <Trophy className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                {status === "Upcoming" && <Calendar className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                {status}
              </Badge>
            </div>

            {/* Prize Pool Section - Modern Design */}
            {competition.hasPrizes && competition.prizes.length > 0 && (
              <div className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
                <div className="relative flex flex-col md:flex-row items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full flex items-center justify-center">
                      <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-1">PRIZE POOL</div>
                      <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center">
                        <IndianRupee className="h-6 w-6 md:h-7 md:w-7 mr-1" />
                        {competition.prizes.reduce((total, prize) => total + prize.amount, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Prize Distribution Preview */}
                  <div className="hidden md:flex items-center gap-3">
                    {competition.prizes.slice(0, 3).map((prize, index) => (
                      <div key={prize.position} className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 text-sm shadow-sm border border-gray-200 dark:border-gray-600">
                        <div className="font-medium text-gray-500 dark:text-gray-400 text-xs mb-1">
                          {prize.position === "FIRST" ? "1st Place" :
                           prize.position === "SECOND" ? "2nd Place" :
                           prize.position === "THIRD" ? "3rd Place" : prize.position}
                        </div>
                        <div className="font-bold flex items-center text-primary">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {prize.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {competition.prizes.length > 3 && (
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        +{competition.prizes.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Competition Info - Compact Version */}
            <div className="mt-4 flex flex-wrap gap-3">
              {/* Media Type */}
              <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-gray-400">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 8h6" />
                  <path d="M9 12h6" />
                  <path d="M9 16h6" />
                </svg>
                <span>
                  {competition.mediaType === "IMAGE_ONLY" ? "Images Only" :
                   competition.mediaType === "VIDEO_ONLY" ? "Videos Only" :
                   "Images & Videos"}
                </span>
              </div>

              {/* Duration */}
              <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span>{competition.rounds.length} {competition.rounds.length === 1 ? "Round" : "Rounds"}</span>
              </div>

              {/* Entry Fee */}
              {competition.isPaid && competition.entryFee && (
                <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                  <IndianRupee className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span>Entry Fee: ₹{competition.entryFee}</span>
                </div>
              )}

              {/* Current Round */}
              {currentRound && (
                <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                  <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span>Round: {currentRound.name}</span>
                </div>
              )}

              {/* Next Round */}
              {!currentRound && nextRound && (
                <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span>Starts: {format(new Date(nextRound.startDate), "MMM d")}</span>
                </div>
              )}

              {/* Status for Completed */}
              {!currentRound && !nextRound && status === "Completed" && (
                <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                  <Trophy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  <span>Completed</span>
                </div>
              )}

              {/* Participant Count */}
              <div className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                <Users className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                <span><strong>{competition._count.participants}</strong> participants</span>
              </div>
            </div>
          </div>
        </div>



        {/* Competition Stickers - Only shown when competition has stickers */}
        {(competition.DefaultStickers || competition.OptionalStickers) && (
          <CompetitionStickers
            defaultStickers={competition.DefaultStickers}
            optionalStickers={competition.OptionalStickers}
          />
        )}

        {/* Competition Completion Message - Show when auto-terminated */}
        {competition.completionReason && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Competition Ended
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>{competition.completionReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Winners Section - Only shown when competition is completed */}
        {status === "Completed" && !competition.completionReason && (
          <CompetitionWinners competitionId={competition.id} isCompleted={status === "Completed"} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Tabs for Details and Upload Post */}
            <TabsWithUrlSync defaultValue={status === "Active" ? "feed" : "details"} isParticipant={isParticipant} status={status}>

              {/* Details Tab Content */}
              <TabsContent value="details" className="space-y-6">
                {/* Rounds Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-2xl font-bold">Competition Rounds</h2>
                    {currentRound && (
                      <Badge variant="default" className="bg-green-500">
                        Active Round
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-4">
                    {competition.rounds
                      .filter((round) => {
                        // If competition is terminated, only show rounds that have already started
                        if (!competition.isActive || competition.completionReason) {
                          return new Date(round.startDate) <= currentDate;
                        }
                        // If competition is active, show all rounds
                        return true;
                      })
                      .map((round) => {
                      // Check if the user has submitted an entry for this round
                      const hasSubmittedEntry = isLoggedIn && isParticipant &&
                        (competition.participants[0] as any)?.roundEntries?.some(
                          (entry: any) => entry.round.id === round.id && entry.post
                        );

                      return (
                        <CompetitionRoundInfo
                          key={round.id}
                          round={round}
                          isCurrentRound={currentRound?.id === round.id}
                          hasSubmittedEntry={hasSubmittedEntry}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Prize Distribution - Only shown when competition has prizes */}
                {competition.hasPrizes && (
                  <PrizeDistributionCard
                    prizes={competition.prizes || []}
                  />
                )}
              </TabsContent>

              {/* Feed Tab Content */}
              <TabsContent value="feed">
                {status === "Upcoming" ? (
                  <div className="p-8 text-center border border-border rounded-lg bg-card/50">
                    <h3 className="text-lg font-medium mb-2">Competition Not Started</h3>
                    <p className="text-muted-foreground">
                      The competition feed will be available once the competition starts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <RoundSelector
                        rounds={competition.rounds
                          .map(round => ({
                            id: round.id,
                            name: round.name,
                            startDate: round.startDate.toString(),
                            endDate: round.endDate.toString()
                          }))}
                        currentRoundId={currentRound?.id}
                        isCompetitionTerminated={!!competition.completionReason}
                        completionReason={competition.completionReason || undefined}
                      />
                    </div>

                    {/* Competition feed component */}
                    <div className="mt-4">
                      <CompetitionFeedWrapper competitionId={competition.id} />
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Upload Post Tab Content */}
              <TabsContent value="upload">
                {!isLoggedIn ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sign In to Join Competition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground">
                        Sign in to join this competition, showcase your talent, and compete with other creators. Submit your entries and get a chance to win!
                      </p>
                      <a
                        href={`/login/google?from=${encodeURIComponent(`/competitions/${params.slug}?tab=upload`)}`}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                      >
                        Sign In to Join
                      </a>
                    </CardContent>
                  </Card>
                ) : !isParticipant ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Join Competition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-muted-foreground">
                        Join this competition to showcase your talent and compete with other creators. Submit your entries and get a chance to win!
                      </p>
                      <ParticipateButton
                        competitionId={competition.id}
                        isParticipant={isParticipant}
                        competitionTitle={competition.title}
                        isPaid={competition.isPaid}
                        entryFee={competition.entryFee}
                        isActive={competition.isActive && (status === "Active" || status === "Upcoming")}
                        firstRoundCompleted={firstRoundCompleted}
                        hasPaid={hasPaid}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">My Entries</h2>
                    </div>

                    {/* Show upload cards for each round */}
                    <div className="space-y-4">
                      {competition.rounds
                        .map((round) => {
                        // Find the user's entry for this round
                        const entry = isParticipant && (competition.participants[0] as any)?.roundEntries?.find(
                          (entry: any) => entry.round.id === round.id
                        );

                        return (
                          <RoundUploadCard
                            key={round.id}
                            competitionId={competition.id}
                            round={{
                              id: round.id,
                              name: round.name,
                              startDate: round.startDate.toString(),
                              endDate: round.endDate.toString(),
                              likesToPass: round.likesToPass
                            }}
                            mediaType={competition.mediaType as 'IMAGE_ONLY' | 'VIDEO_ONLY' | 'BOTH'}
                            maxDuration={competition.maxDuration || undefined}
                            roundStarted={new Date(round.startDate) <= new Date()}
                            roundEnded={new Date(round.endDate) < new Date()}
                            isCompetitionCompleted={status === "Completed" || !!competition.completionReason}
                            existingPost={entry?.post ? {
                              id: entry.post.id,
                              content: entry.post.content || "",
                              attachments: entry.post.attachments.map((a: any) => ({
                                id: a.id,
                                url: a.url,
                                type: a.type
                              }))
                            } : undefined}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </TabsWithUrlSync>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* About This Competition - Simplified */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  About This Competition
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competition.description && (
                  <div className="mb-3 text-sm">
                    <HtmlContent html={competition.description} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{competition._count.participants}</strong> participants</span>
                </div>
              </CardContent>
            </Card>

            {/* Competition Info Card - Simplified */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  Competition Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {format(new Date(competition.createdAt), "MMM d, yyyy")}</span>
                </div>

                {(competition.minAge || competition.maxAge) && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Age: {competition.minAge && competition.maxAge
                      ? `${competition.minAge} - ${competition.maxAge} years`
                      : competition.minAge
                        ? `${competition.minAge}+ years`
                        : `Up to ${competition.maxAge} years`}</span>
                  </div>
                )}

                {currentRound && (
                  <div className="border-t pt-3 mt-3">
                    <div className="font-medium mb-1">Current Round: {currentRound.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Ends {format(new Date(currentRound.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                )}

                {nextRound && !currentRound && (
                  <div className="border-t pt-3 mt-3">
                    <div className="font-medium mb-1">Next Round: {nextRound.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Starts {format(new Date(nextRound.startDate), "MMM d, yyyy")}
                    </div>
                  </div>
                )}

                {/* Rounds Information */}
                <div className="border-t pt-3 mt-3">
                  <div className="font-medium mb-2">Rounds Schedule</div>
                  <div className="space-y-2">
                    {competition.rounds.map((round, index) => (
                      <div key={round.id} className="text-xs">
                        <div className="font-medium text-sm">{round.name}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span>Start: {format(new Date(round.startDate), "MMM d, yyyy h:mm a")}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span>End: {format(new Date(round.endDate), "MMM d, yyyy h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {competition.hasPrizes && competition.prizes.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <div className="font-medium mb-1">Prize Distribution</div>
                    <div className="space-y-1">
                      {competition.prizes.map((prize, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span>{prize.position}</span>
                          <span className="font-medium">₹{prize.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    debug.error('Error in competition page:', error);
    debug.error('Competition lookup failed for slug/ID:', params.slug);

    // Log detailed error information
    if (error instanceof Error) {
      debug.error(`Error name: ${error.name}`);
      debug.error(`Error message: ${error.message}`);
      debug.error(`Error stack: ${error.stack}`);
    }

    // Return a custom error page instead of 404
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Competition Temporarily Unavailable</h1>
          <p className="text-red-600 mb-4">
            We're experiencing some technical difficulties with this competition. Our team has been notified and is working to resolve the issue.
          </p>
          <p className="text-red-600 mb-2">
            Please try again later or contact support if the problem persists.
          </p>
          <div className="mt-6">
            <a href="/competitions" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
              View All Competitions
            </a>
          </div>
        </div>
      </div>
    );
  }
}