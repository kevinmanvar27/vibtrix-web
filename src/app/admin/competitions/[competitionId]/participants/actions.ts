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

  // Get total participants count using raw SQL
  const totalParticipantsResult = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM competition_participants
    WHERE "competitionId" = ${competitionId}
  `;
  const totalParticipants = Number((totalParticipantsResult as any[])[0].count);

  // Get round-wise statistics and entries
  const roundStats = await Promise.all(
    competition.rounds.map(async (round) => {
      // Count entries for this round using raw SQL
      const totalEntriesResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM competition_round_entries cre
        JOIN competition_participants cp ON cre."participantId" = cp.id
        WHERE cre."roundId" = ${round.id}
        AND cp."competitionId" = ${competitionId}
      `;
      const totalEntries = Number((totalEntriesResult as any[])[0].count);

      // Count entries with posts using raw SQL
      const entriesWithPostsResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM competition_round_entries cre
        JOIN competition_participants cp ON cre."participantId" = cp.id
        WHERE cre."roundId" = ${round.id}
        AND cp."competitionId" = ${competitionId}
        AND cre."postId" IS NOT NULL
      `;
      const entriesWithPosts = Number((entriesWithPostsResult as any[])[0].count);

      // Count qualified entries using raw SQL
      const qualifiedEntriesResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM competition_round_entries cre
        JOIN competition_participants cp ON cre."participantId" = cp.id
        WHERE cre."roundId" = ${round.id}
        AND cp."competitionId" = ${competitionId}
        AND cre."qualifiedForNextRound" = true
      `;
      const qualifiedEntries = Number((qualifiedEntriesResult as any[])[0].count);

      // Get all entries for this round with participant and post details using raw SQL
      const roundEntriesRaw = await prisma.$queryRaw`
        SELECT
          cre.id,
          cre."participantId",
          cre."roundId",
          cre."postId",
          cre."qualifiedForNextRound",
          cp."userId",
          u.id as "user_id",
          u.username as "user_username",
          u."displayName" as "user_displayName",
          u."avatarUrl" as "user_avatarUrl",
          p.id as "post_id",
          p.content as "post_content",
          (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) as "likes_count",
          cr.id as "round_id",
          cr.name as "round_name"
        FROM competition_round_entries cre
        JOIN competition_participants cp ON cre."participantId" = cp.id
        JOIN users u ON cp."userId" = u.id
        LEFT JOIN posts p ON cre."postId" = p.id
        JOIN competition_rounds cr ON cre."roundId" = cr.id
        WHERE cre."roundId" = ${round.id}
        AND cp."competitionId" = ${competitionId}
        ORDER BY cre."createdAt" DESC
      `;

      // Format the round entries
      const roundEntries = (roundEntriesRaw as any[]).map(entry => ({
        id: entry.id,
        participantId: entry.participantId,
        roundId: entry.roundId,
        postId: entry.postId,
        qualifiedForNextRound: entry.qualifiedForNextRound,
        participant: {
          id: entry.participantId,
          userId: entry.userId,
          user: {
            id: entry.user_id,
            username: entry.user_username,
            displayName: entry.user_displayName,
            avatarUrl: entry.user_avatarUrl,
          }
        },
        post: entry.post_id ? {
          id: entry.post_id,
          content: entry.post_content,
          likesCount: Number(entry.likes_count || 0),
        } : null,
        round: {
          id: entry.round_id,
          name: entry.round_name,
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

  // Get participants with their entries
  // Use Prisma's raw query to avoid schema mismatch issues
  const participants = await prisma.$queryRaw`
    SELECT
      cp.id,
      cp."userId",
      cp."competitionId",
      cp."isDisqualified",
      cp."disqualifyReason",
      cp."createdAt",
      cp."currentRoundId",
      cp."hasPaid",
      u.id as "user_id",
      u.username as "user_username",
      u."displayName" as "user_displayName",
      u."avatarUrl" as "user_avatarUrl"
    FROM competition_participants cp
    JOIN users u ON cp."userId" = u.id
    WHERE cp."competitionId" = ${competitionId}
    ORDER BY cp."createdAt" DESC
  `;

  // Format the participants data to match the expected structure
  const formattedParticipants = await Promise.all(
    (participants as any[]).map(async (p: any) => {
      // Get round entries for this participant using raw SQL
      const roundEntriesRaw = await prisma.$queryRaw`
        SELECT
          cre.id,
          cre."participantId",
          cre."roundId",
          cre."postId",
          cre."qualifiedForNextRound",
          cr.id as "round_id",
          cr.name as "round_name",
          cr."startDate" as "round_startDate",
          cr."endDate" as "round_endDate",
          cr."likesToPass" as "round_likesToPass",
          p.id as "post_id",
          p.content as "post_content",
          (SELECT COUNT(*) FROM likes l WHERE l."postId" = p.id) as "likes_count"
        FROM competition_round_entries cre
        JOIN competition_rounds cr ON cre."roundId" = cr.id
        LEFT JOIN posts p ON cre."postId" = p.id
        WHERE cre."participantId" = ${p.id}
      `;

      // Format the round entries
      const roundEntries = (roundEntriesRaw as any[]).map(entry => ({
        id: entry.id,
        participantId: entry.participantId,
        roundId: entry.roundId,
        postId: entry.postId,
        qualifiedForNextRound: entry.qualifiedForNextRound,
        round: {
          id: entry.round_id,
          name: entry.round_name,
          startDate: entry.round_startDate,
          endDate: entry.round_endDate,
          likesToPass: entry.round_likesToPass,
        },
        post: entry.post_id ? {
          id: entry.post_id,
          content: entry.post_content,
          likesCount: Number(entry.likes_count || 0),
        } : null,
      }));

      return {
        id: p.id,
        userId: p.userId,
        competitionId: p.competitionId,
        isDisqualified: p.isDisqualified,
        disqualifyReason: p.disqualifyReason,
        createdAt: p.createdAt,
        currentRoundId: p.currentRoundId,
        hasPaid: p.hasPaid,
        user: {
          id: p.user_id,
          username: p.user_username,
          displayName: p.user_displayName,
          avatarUrl: p.user_avatarUrl,
        },
        roundEntries,
      };
    })
  );

  return {
    competition,
    totalParticipants,
    roundStats,
    participants: formattedParticipants,
  };
}
