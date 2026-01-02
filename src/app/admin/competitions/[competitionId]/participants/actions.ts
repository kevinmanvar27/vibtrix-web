"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function getCompetitionParticipantsStats(competitionId: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Get the competition with rounds
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      rounds: {
        orderBy: {
          startDate: 'asc',
        },
      },
    },
  });

  if (!competition) {
    throw new Error("Competition not found");
  }

  // Get total participants count using Prisma
  const totalParticipants = await prisma.competitionParticipant.count({
    where: {
      competitionId: competitionId,
    },
  });

  // Get round-wise statistics and entries
  const roundStats = await Promise.all(
    competition.rounds.map(async (round) => {
      // Count entries for this round using Prisma
      const totalEntries = await prisma.competitionRoundEntry.count({
        where: {
          roundId: round.id,
          participant: {
            competitionId: competitionId,
          },
        },
      });

      // Count entries with posts using Prisma
      const entriesWithPosts = await prisma.competitionRoundEntry.count({
        where: {
          roundId: round.id,
          participant: {
            competitionId: competitionId,
          },
          postId: {
            not: null,
          },
        },
      });

      // Count qualified entries using Prisma
      const qualifiedEntries = await prisma.competitionRoundEntry.count({
        where: {
          roundId: round.id,
          participant: {
            competitionId: competitionId,
          },
          qualifiedForNextRound: true,
        },
      });

      // Get all entries for this round with participant and post details using Prisma
      const roundEntriesRaw = await prisma.competitionRoundEntry.findMany({
        where: {
          roundId: round.id,
          participant: {
            competitionId: competitionId,
          },
        },
        include: {
          participant: {
            include: {
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
          post: {
            select: {
              id: true,
              content: true,
              _count: {
                select: {
                  likes: true,
                },
              },
            },
          },
          round: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format the round entries
      const roundEntries = roundEntriesRaw.map(entry => ({
        id: entry.id,
        participantId: entry.participantId,
        roundId: entry.roundId,
        postId: entry.postId,
        qualifiedForNextRound: entry.qualifiedForNextRound,
        participant: {
          id: entry.participant.id,
          userId: entry.participant.userId,
          user: {
            id: entry.participant.user.id,
            username: entry.participant.user.username,
            displayName: entry.participant.user.displayName,
            avatarUrl: entry.participant.user.avatarUrl,
          }
        },
        post: entry.post ? {
          id: entry.post.id,
          content: entry.post.content,
          likesCount: entry.post._count.likes,
        } : null,
        round: {
          id: entry.round.id,
          name: entry.round.name,
        }
      }));

      return {
        roundId: round.id,
        roundName: round.name,
        startDate: round.startDate,
        endDate: round.endDate,
        totalEntries,
        entriesWithPosts,
        qualifiedEntries,
        roundEntries,
      };
    })
  );

  // Get participants with their entries using Prisma
  const participantsRaw = await prisma.competitionParticipant.findMany({
    where: {
      competitionId: competitionId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      roundEntries: {
        include: {
          round: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              likesToPass: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              _count: {
                select: {
                  likes: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Format the participants data to match the expected structure
  const formattedParticipants = participantsRaw.map((p) => ({
    id: p.id,
    userId: p.userId,
    competitionId: p.competitionId,
    isDisqualified: p.isDisqualified,
    disqualifyReason: p.disqualifyReason,
    createdAt: p.createdAt,
    currentRoundId: p.currentRoundId,
    hasPaid: p.hasPaid,
    user: {
      id: p.user.id,
      username: p.user.username,
      displayName: p.user.displayName,
      avatarUrl: p.user.avatarUrl,
    },
    roundEntries: p.roundEntries.map(entry => ({
      id: entry.id,
      participantId: entry.participantId,
      roundId: entry.roundId,
      postId: entry.postId,
      qualifiedForNextRound: entry.qualifiedForNextRound,
      round: {
        id: entry.round.id,
        name: entry.round.name,
        startDate: entry.round.startDate,
        endDate: entry.round.endDate,
        likesToPass: entry.round.likesToPass,
      },
      post: entry.post ? {
        id: entry.post.id,
        content: entry.post.content,
        likesCount: entry.post._count.likes,
      } : null,
    })),
  }));

  return {
    competition,
    totalParticipants,
    roundStats,
    participants: formattedParticipants,
  };
}
