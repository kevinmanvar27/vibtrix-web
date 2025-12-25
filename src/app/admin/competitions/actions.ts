"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { generateUniqueCompetitionSlug } from "@/lib/slug-utils";
import { CompetitionMediaType } from "@prisma/client";
import { z } from "zod";

import debug from "@/lib/debug";

const roundSchema = z.object({
  id: z.string().optional(), // Add id field to identify existing rounds
  name: z.string().min(1, "Round name is required"),
  startDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Invalid end date",
  }),
  endTime: z.string().min(1, "End time is required"),
  likesToPass: z.number().int().optional().nullable(),
  // Add fields for original dates (when editing)
  _originalStartDate: z.any().optional(),
  _originalEndDate: z.any().optional(),
});



const prizeSchema = z.object({
  position: z.enum(["FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "PARTICIPATION"]),
  amount: z.number().min(0, "Prize amount must be at least 0"),
  description: z.string().optional().nullable(),
});

const competitionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional().nullable(),
  mediaType: z.nativeEnum(CompetitionMediaType),
  minLikes: z.number().int().optional().nullable(),
  maxDuration: z.number().int().optional().nullable(),
  minAge: z.number().int().optional().nullable(),
  maxAge: z.number().int().optional().nullable(),
  requiredGender: z.string().optional().nullable(),
  isActive: z.boolean(),
  isPaid: z.boolean().default(false),
  entryFee: z.number().min(0).optional().nullable(),
  defaultHashtag: z.string().optional().nullable()
    .transform(val => {
      if (!val) return null;
      // Ensure the hashtag starts with #
      return val.startsWith('#') ? val : `#${val}`;
    }),
  // hasPrizes field is handled separately
  prizes: z.array(prizeSchema).optional(),
  rounds: z.array(roundSchema).min(1, "At least one round is required"),
}).refine(data => {
  // If both minAge and maxAge are provided, ensure maxAge is greater than or equal to minAge
  if (data.minAge !== null && data.maxAge !== null && data.maxAge !== undefined && data.minAge !== undefined) {
    return data.maxAge >= data.minAge;
  }
  return true;
}, {
  message: "Maximum age must be greater than or equal to minimum age",
  path: ["maxAge"], // This will show the error on the maxAge field
});

export type CompetitionFormValues = z.infer<typeof competitionSchema>;

export interface PromotionStickerData {
  title: string;
  imageUrl: string;
  position: string;
  limit: number | null;
  isActive: boolean;
}

export async function createCompetition(data: CompetitionFormValues, promotionStickers?: PromotionStickerData[]) {
  debug.log('Creating competition with data:', data);
  debug.log('Promotion stickers:', promotionStickers);

  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }


  const validatedData = competitionSchema.parse(data);

  // Validate round dates and times
  for (const round of validatedData.rounds) {
    // Parse the dates and times from the form inputs
    // HTML5 date input format is YYYY-MM-DD
    const [startYear, startMonth, startDay] = round.startDate.split('-').map(Number);
    // HTML5 time input format is HH:MM:SS in 24-hour format when step="1" is used
    const startTimeParts = round.startTime.split(':').map(Number);
    const startHours = startTimeParts[0];
    const startMinutes = startTimeParts[1];
    const startSeconds = startTimeParts.length > 2 ? startTimeParts[2] : 0; // Handle seconds if present

    // Create the start date
    const startDateTime = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, startSeconds);

    // Do the same for end date
    const [endYear, endMonth, endDay] = round.endDate.split('-').map(Number);
    const endTimeParts = round.endTime.split(':').map(Number);
    const endHours = endTimeParts[0];
    const endMinutes = endTimeParts[1];
    const endSeconds = endTimeParts.length > 2 ? endTimeParts[2] : 0; // Handle seconds if present

    // Create the end date
    const endDateTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, endSeconds);

    if (endDateTime <= startDateTime) {
      throw new Error(`Round ${round.name}: End date/time must be after start date/time`);
    }
  }

  // Validate age restrictions
  if (validatedData.minAge !== null && validatedData.maxAge !== null &&
      validatedData.maxAge !== undefined && validatedData.minAge !== undefined &&
      validatedData.maxAge < validatedData.minAge) {
    throw new Error("Maximum age must be greater than or equal to minimum age");
  }

  // Parse all round dates to find the earliest start date and latest end date
  const roundDates = validatedData.rounds.map(round => {
    // Parse the dates and times from the form inputs
    // HTML5 date input format is YYYY-MM-DD
    const [startYear, startMonth, startDay] = round.startDate.split('-').map(Number);
    // HTML5 time input format is HH:MM:SS in 24-hour format when step="1" is used
    const startTimeParts = round.startTime.split(':').map(Number);
    const startHours = startTimeParts[0];
    const startMinutes = startTimeParts[1];
    const startSeconds = startTimeParts.length > 2 ? startTimeParts[2] : 0; // Handle seconds if present

    // Create the start date
    const startDate = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, startSeconds);

    // Do the same for end date
    const [endYear, endMonth, endDay] = round.endDate.split('-').map(Number);
    const endTimeParts = round.endTime.split(':').map(Number);
    const endHours = endTimeParts[0];
    const endMinutes = endTimeParts[1];
    const endSeconds = endTimeParts.length > 2 ? endTimeParts[2] : 0; // Handle seconds if present

    // Create the end date
    const endDate = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, endSeconds);

    return { startDate, endDate };
  });

  // Find the earliest start date and latest end date
  const earliestStartDate = new Date(Math.min(...roundDates.map(d => d.startDate.getTime())));
  const latestEndDate = new Date(Math.max(...roundDates.map(d => d.endDate.getTime())));

  // Generate the unique slug
  const slug = await generateUniqueCompetitionSlug(validatedData.title, earliestStartDate, latestEndDate);

  // Create competition
  debug.log('Creating competition with slug:', slug);
  try {
    // Create competition data
    const createData: any = {
      title: validatedData.title,
      slug: slug,
      description: validatedData.description,
      mediaType: validatedData.mediaType,
      minLikes: validatedData.minLikes,
      maxDuration: validatedData.maxDuration,
      minAge: validatedData.minAge,
      maxAge: validatedData.maxAge,
      requiredGender: validatedData.requiredGender === "none" ? null : validatedData.requiredGender,
      isActive: validatedData.isActive,
      isPaid: validatedData.isPaid,
      entryFee: validatedData.isPaid ? validatedData.entryFee : null,
      defaultHashtag: validatedData.defaultHashtag,
      hasPrizes: validatedData.prizes && validatedData.prizes.length > 0,
      showFeedStickers: true, // Add the missing field with default value
    };

    // Add rounds data
    createData.rounds = {
          create: validatedData.rounds.map(round => {
            // Parse the dates and times from the form inputs
            // HTML5 date input format is YYYY-MM-DD
            const [startYear, startMonth, startDay] = round.startDate.split('-').map(Number);
            // HTML5 time input format is HH:MM:SS in 24-hour format when step="1" is used
            const startTimeParts = round.startTime.split(':').map(Number);
            const startHours = startTimeParts[0];
            const startMinutes = startTimeParts[1];
            const startSeconds = startTimeParts.length > 2 ? startTimeParts[2] : 0; // Handle seconds if present

            // Create the start date
            const startDate = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, startSeconds);

            // Do the same for end date
            const [endYear, endMonth, endDay] = round.endDate.split('-').map(Number);
            const endTimeParts = round.endTime.split(':').map(Number);
            const endHours = endTimeParts[0];
            const endMinutes = endTimeParts[1];
            const endSeconds = endTimeParts.length > 2 ? endTimeParts[2] : 0; // Handle seconds if present

            // Create the end date
            const endDate = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, endSeconds);

            return {
              name: round.name,
              startDate: startDate,
              endDate: endDate,
              likesToPass: round.likesToPass,
            };
          })
        }

    const competition = await prisma.competition.create({
      data: createData,
    });


    // Create promotion stickers if provided
    if (promotionStickers && promotionStickers.length > 0) {
      await Promise.all(
        promotionStickers.map(sticker =>
          prisma.promotionSticker.create({
            data: {
              title: sticker.title,
              imageUrl: sticker.imageUrl,
              position: sticker.position as any,
              limit: sticker.limit,
              isActive: sticker.isActive,
              competitionId: competition.id,
            }
          })
        )
      );
    }

    // Create prizes if provided
    if (validatedData.prizes && validatedData.prizes.length > 0) {
      try {
        await Promise.all(
          validatedData.prizes.map(prize =>
            prisma.competitionPrize.create({
              data: {
                competitionId: competition.id,
                position: prize.position,
                amount: prize.amount,
                description: prize.description || null,
              }
            })
          )
        );
      } catch (error) {
        debug.error('Error creating prizes:', error);
        // Continue without creating prizes
      }
    }

    debug.log('Returning created competition:', competition);
    return competition;
  } catch (error) {
    debug.error('Error creating competition:', error);
    throw error;
  }
}

export async function updateCompetition(id: string, data: CompetitionFormValues) {
  debug.log('Updating competition:', id);
  debug.log('Form data:', data);

  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }


  const validatedData = competitionSchema.parse(data);

  // Identify rounds that have already started
  const currentDate = new Date();

  // Get existing rounds to check which ones have already started
  const existingRounds = await prisma.competitionRound.findMany({
    where: { competitionId: id }
  });

  // Identify rounds that have already started
  const startedRoundIds = existingRounds
    .filter(round => round.startDate <= currentDate)
    .map(round => round.id);

  // Create a map of existing rounds by ID for easier lookup
  const existingRoundsById = new Map();
  existingRounds.forEach(round => {
    existingRoundsById.set(round.id, round);
  });

  // Validate round dates and times
  for (const round of validatedData.rounds) {
    // Check if this is an existing round that has already started
    const isStartedRound = round.id && startedRoundIds.includes(round.id);

    // If it's a started round, we don't need to validate its dates
    if (isStartedRound) {
      continue;
    }

    // Parse the dates and times from the form inputs
    // HTML5 date input format is YYYY-MM-DD
    const [startYear, startMonth, startDay] = round.startDate.split('-').map(Number);
    // HTML5 time input format is HH:MM:SS in 24-hour format when step="1" is used
    const startTimeParts = round.startTime.split(':').map(Number);
    const startHours = startTimeParts[0];
    const startMinutes = startTimeParts[1];
    const startSeconds = startTimeParts.length > 2 ? startTimeParts[2] : 0; // Handle seconds if present

    // Create the start date
    const startDateTime = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, startSeconds);

    // Do the same for end date
    const [endYear, endMonth, endDay] = round.endDate.split('-').map(Number);
    const endTimeParts = round.endTime.split(':').map(Number);
    const endHours = endTimeParts[0];
    const endMinutes = endTimeParts[1];
    const endSeconds = endTimeParts.length > 2 ? endTimeParts[2] : 0; // Handle seconds if present

    // Create the end date
    const endDateTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, endSeconds);

    // Validate end date is after start date
    if (endDateTime <= startDateTime) {
      throw new Error(`Round ${round.name}: End date/time must be after start date/time`);
    }

    // For new rounds, validate that start date is in the future
    // But only if the round doesn't have an ID (truly new rounds)
    // We need to check if it's a completely new round, not just a round without an ID
    // that might be a started round that lost its ID during form processing
    const isExistingRoundByName = existingRounds.some(existingRound =>
      existingRound.name === round.name
    );

    // Only validate future dates for completely new rounds
    if (!round.id && !isExistingRoundByName && startDateTime <= currentDate) {
      throw new Error(`Round ${round.name}: Start date/time must be in the future`);
    }
  }

  // Validate age restrictions
  if (validatedData.minAge !== null && validatedData.maxAge !== null &&
      validatedData.maxAge !== undefined && validatedData.minAge !== undefined &&
      validatedData.maxAge < validatedData.minAge) {
    throw new Error("Maximum age must be greater than or equal to minimum age");
  }

  // Update the existing rounds with entries information for handling deletions
  const existingRoundsWithEntries = await prisma.competitionRound.findMany({
    where: { competitionId: id },
    include: {
      entries: {
        select: {
          id: true,
          participantId: true,
          postId: true
        }
      }
    }
  });

  // Create a map of existing rounds by name for easier lookup when handling deletions
  const existingRoundsByName = new Map();
  existingRoundsWithEntries.forEach(round => {
    existingRoundsByName.set(round.name, round);
  });

  // Process all rounds to find the earliest start date and latest end date
  // We need to handle both existing rounds and new rounds
  const allRoundDates: { startDate: Date, endDate: Date }[] = [];

  for (const round of validatedData.rounds) {
    // Parse the dates and times from the form inputs
    const [startYear, startMonth, startDay] = round.startDate.split('-').map(Number);
    const startTimeParts = round.startTime.split(':').map(Number);
    const startHours = startTimeParts[0];
    const startMinutes = startTimeParts[1];
    const startSeconds = startTimeParts.length > 2 ? startTimeParts[2] : 0; // Handle seconds if present
    const startDate = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, startSeconds);

    const [endYear, endMonth, endDay] = round.endDate.split('-').map(Number);
    const endTimeParts = round.endTime.split(':').map(Number);
    const endHours = endTimeParts[0];
    const endMinutes = endTimeParts[1];
    const endSeconds = endTimeParts.length > 2 ? endTimeParts[2] : 0; // Handle seconds if present
    const endDate = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, endSeconds);

    allRoundDates.push({ startDate, endDate });
  }

  // Find the earliest start date and latest end date
  const earliestStartDate = new Date(Math.min(...allRoundDates.map(d => d.startDate.getTime())));
  const latestEndDate = new Date(Math.max(...allRoundDates.map(d => d.endDate.getTime())));

  // Generate the unique slug (excluding current competition from uniqueness check)
  const slug = await generateUniqueCompetitionSlug(validatedData.title, earliestStartDate, latestEndDate, id);

  // Update the competition basic info
  debug.log('Updating competition with data:', {
    title: validatedData.title,
    slug: slug,
    description: validatedData.description,
    mediaType: validatedData.mediaType,
    minLikes: validatedData.minLikes,
    maxDuration: validatedData.maxDuration,
    minAge: validatedData.minAge,
    maxAge: validatedData.maxAge,
    isActive: validatedData.isActive,
    isPaid: validatedData.isPaid,
    entryFee: validatedData.isPaid ? validatedData.entryFee : null,
    defaultHashtag: validatedData.defaultHashtag,
  });

  let competition;
  try {
    // Create update data
    const updateData: any = {
      title: validatedData.title,
      slug: slug,
      description: validatedData.description,
      mediaType: validatedData.mediaType,
      minLikes: validatedData.minLikes,
      maxDuration: validatedData.maxDuration,
      minAge: validatedData.minAge,
      maxAge: validatedData.maxAge,
      requiredGender: validatedData.requiredGender === "none" ? null : validatedData.requiredGender,
      isActive: validatedData.isActive,
      isPaid: validatedData.isPaid,
      entryFee: validatedData.isPaid ? validatedData.entryFee : null,
      defaultHashtag: validatedData.defaultHashtag,
      hasPrizes: validatedData.prizes && validatedData.prizes.length > 0,
      showFeedStickers: true // Add the missing field with default value
    };

    // Update the competition
    competition = await prisma.competition.update({
      where: { id },
      data: updateData,
    });


    debug.log('Competition updated successfully:', competition);
  } catch (error) {
    debug.error('Error updating competition:', error);
    throw error;
  }

  // Handle prizes
  debug.log('Handling prizes:', validatedData.prizes);
  try {
    // First, get all existing prizes for this competition
    debug.log('Finding existing prizes for competition:', id);
    const existingPrizes = await prisma.competitionPrize.findMany({
      where: { competitionId: id },
    });
    debug.log('Existing prizes:', existingPrizes);

    if (validatedData.prizes && validatedData.prizes.length > 0) {
      // Create a map of existing prizes by position for easier lookup
      const existingPrizesByPosition = new Map();
      existingPrizes.forEach(prize => {
        existingPrizesByPosition.set(prize.position, prize);
      });
      debug.log('Existing prizes by position:', Array.from(existingPrizesByPosition.entries()));

      // Process each prize from the form
      for (const prize of validatedData.prizes) {
        debug.log('Processing prize:', prize);
        const existingPrize = existingPrizesByPosition.get(prize.position);
        debug.log('Existing prize for position', prize.position, ':', existingPrize);

        if (existingPrize) {
          // Update existing prize
          debug.log('Updating existing prize:', existingPrize.id);
          try {
            const updatedPrize = await prisma.competitionPrize.update({
              where: { id: existingPrize.id },
              data: {
                amount: prize.amount,
                description: prize.description || null,
              },
            });
            debug.log('Prize updated successfully:', updatedPrize);
          } catch (updateError) {
            debug.error('Error updating prize:', updateError);
            throw updateError; // Rethrow to stop the process if update fails
          }

          // Remove from map to track which ones we've processed
          existingPrizesByPosition.delete(prize.position);
        } else {
          // Create new prize
          debug.log('Creating new prize for position:', prize.position);
          try {
            const newPrize = await prisma.competitionPrize.create({
              data: {
                competitionId: id,
                position: prize.position,
                amount: prize.amount,
                description: prize.description || null,
              },
            });
            debug.log('Prize created successfully:', newPrize);
          } catch (createError) {
            debug.error('Error creating prize:', createError);
            throw createError; // Rethrow to stop the process if creation fails
          }
        }
      }

      // Delete any prizes that weren't in the form
      debug.log('Prizes to delete:', Array.from(existingPrizesByPosition.values()));
      for (const [position, prizeToDelete] of existingPrizesByPosition.entries()) {
        debug.log('Deleting prize for position:', position, 'ID:', prizeToDelete.id);
        try {
          await prisma.competitionPrize.delete({
            where: { id: prizeToDelete.id },
          });
          debug.log('Prize deleted successfully');
        } catch (deleteError) {
          debug.error('Error deleting prize:', deleteError);
          throw deleteError; // Rethrow to stop the process if deletion fails
        }
      }
    } else {
      // If no prizes provided, delete all existing prizes
      if (existingPrizes.length > 0) {
        debug.log('Deleting all existing prizes as none were provided in the form');
        await prisma.competitionPrize.deleteMany({
          where: { competitionId: id },
        });
        debug.log('All prizes deleted successfully');
      }
    }
  } catch (error) {
    debug.error('Error handling prizes:', error);
    throw new Error(`Failed to update prize distribution: ${(error as any)?.message || 'Unknown error'}`);
  }

  // Process each round from the form
  for (const round of validatedData.rounds) {
    // Check if this is an existing round that has already started
    const isStartedRound = round.id && startedRoundIds.includes(round.id);

    if (isStartedRound) {
      // For started rounds, we don't update any fields
      // Just remove it from the map to track which ones we've processed
      const existingRound = existingRoundsById.get(round.id);
      if (existingRound) {
        existingRoundsByName.delete(existingRound.name);
      }

      // Skip to the next round without updating
      continue;
    }

    // Parse the dates and times from the form inputs
    const [startYear, startMonth, startDay] = round.startDate.split('-').map(Number);
    const startTimeParts = round.startTime.split(':').map(Number);
    const startHours = startTimeParts[0];
    const startMinutes = startTimeParts[1];
    const startSeconds = startTimeParts.length > 2 ? startTimeParts[2] : 0; // Handle seconds if present
    const startDate = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, startSeconds);

    const [endYear, endMonth, endDay] = round.endDate.split('-').map(Number);
    const endTimeParts = round.endTime.split(':').map(Number);
    const endHours = endTimeParts[0];
    const endMinutes = endTimeParts[1];
    const endSeconds = endTimeParts.length > 2 ? endTimeParts[2] : 0; // Handle seconds if present
    const endDate = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, endSeconds);

    if (round.id) {
      // This is an existing round that hasn't started yet

      // Check if the round name is being changed
      const existingRound = existingRoundsById.get(round.id);
      const isNameChanged = existingRound && existingRound.name !== round.name;

      // If the name is changing, we need to check if there are any entries with posts
      if (isNameChanged) {
        // Get entries for this round
        const entriesWithPosts = await prisma.competitionRoundEntry.findMany({
          where: {
            roundId: round.id,
            postId: { not: null }
          },
          include: {
            post: true
          }
        });

        // If there are entries with posts, we should update the round but preserve the entries
        if (entriesWithPosts.length > 0) {
          debug.log(`Round ${existingRound.name} has ${entriesWithPosts.length} entries with posts. Updating round but preserving entries.`);

          // Update the existing round with the new details
          await prisma.competitionRound.update({
            where: { id: round.id },
            data: {
              name: round.name,
              startDate: startDate,
              endDate: endDate,
              likesToPass: round.likesToPass,
            },
          });

          debug.log(`Updated round ${round.id} from "${existingRound.name}" to "${round.name}" while preserving ${entriesWithPosts.length} entries`);

          // Remove the existing round from the map so it doesn't get deleted
          existingRoundsByName.delete(existingRound.name);

          // Skip to the next round since we've already updated it
          continue;
        }
      }

      // Update the existing round if there are no entries with posts or the name isn't changing
      await prisma.competitionRound.update({
        where: { id: round.id },
        data: {
          name: round.name,
          startDate: startDate,
          endDate: endDate,
          likesToPass: round.likesToPass,
        },
      });

      // After updating the round, ensure all entries with posts remain visible
      try {
        const entriesWithPosts = await prisma.competitionRoundEntry.findMany({
          where: {
            roundId: round.id,
            postId: { not: null }
          }
        });

        if (entriesWithPosts.length > 0) {
          debug.log(`Ensuring visibility for ${entriesWithPosts.length} entries in updated round ${round.name}`);
          // Update entries individually to respect round start dates
          const currentDate = new Date();

          for (const entry of entriesWithPosts) {
            // Get the round details
            const round = await prisma.competitionRound.findUnique({
              where: { id: entry.roundId }
            });

            if (round) {
              // Check if the round has started
              const roundStarted = new Date(round.startDate) <= currentDate;

              // Update the entry with appropriate visibility
              await prisma.competitionRoundEntry.update({
                where: { id: entry.id },
                data: {
                  visibleInCompetitionFeed: roundStarted,
                  visibleInNormalFeed: roundStarted,
                  updatedAt: new Date()
                }
              });

              debug.log(`Updated entry ${entry.id} visibility based on round start date: visibleInNormalFeed=${roundStarted}, visibleInCompetitionFeed=${roundStarted}`);
            }
          }
        }
      } catch (error) {
        debug.error(`Error ensuring visibility for entries in updated round ${round.name}:`, error);
        // Continue without failing the whole update
      }

      // Remove this round from the map to track which ones we've processed
      if (existingRound) {
        existingRoundsByName.delete(existingRound.name);
      }
    } else {
      // Create a new round
      const newRound = await prisma.competitionRound.create({
        data: {
          name: round.name,
          competitionId: id,
          startDate: startDate,
          endDate: endDate,
          likesToPass: round.likesToPass,
        },
      });

      debug.log(`Created new round ${newRound.id} with name ${round.name}`);
    }
  }

  // Any rounds left in the map weren't in the form, so they should be deleted
  // But first, we need to handle their entries to avoid losing user posts
  for (const [_, roundToDelete] of existingRoundsByName.entries()) {
    // Check if this round has already started - if so, we can't delete it
    const hasStarted = startedRoundIds.includes(roundToDelete.id);

    if (hasStarted) {
      // Skip deletion for started rounds
      debug.log(`Skipping deletion of started round: ${roundToDelete.name}`);
      continue;
    }

    // Check if there are entries with posts
    const entriesWithPosts = roundToDelete.entries.filter((entry: any) => entry.postId);

    if (entriesWithPosts.length > 0) {
      debug.log(`Round ${roundToDelete.name} has ${entriesWithPosts.length} entries with posts. KEEPING ROUND.`);

      // Keep the round but update its visibility to ensure entries remain visible
      await prisma.competitionRound.update({
        where: { id: roundToDelete.id },
        data: {
          // Mark as updated to refresh caches
          updatedAt: new Date()
        }
      });

      // Update all entries to ensure they're visible
      for (const entry of entriesWithPosts) {
        await prisma.competitionRoundEntry.update({
          where: { id: entry.id },
          data: {
            visibleInCompetitionFeed: true,
            visibleInNormalFeed: true,
            updatedAt: new Date()
          }
        });
        debug.log(`Updated entry ${entry.id} with post ${entry.postId} to ensure visibility`);
      }

      debug.log(`Kept round ${roundToDelete.name} to preserve ${entriesWithPosts.length} entries with posts`);
      continue;
    }

    // Only delete rounds that have no entries with posts
    await prisma.competitionRound.delete({
      where: { id: roundToDelete.id }
    });
    debug.log(`Deleted round ${roundToDelete.name} (no entries with posts)`);
  }

  // After all updates, completely rebuild all entries to ensure they remain visible
  try {
    debug.log('Rebuilding all entries after competition update');

    // Get all participants for this competition
    const participants = await prisma.competitionParticipant.findMany({
      where: { competitionId: id },
      include: {
        roundEntries: {
          include: {
            post: true,
            round: true,
          },
        },
      },
    });

    debug.log(`Found ${participants.length} participants to process`);

    // Process each participant
    for (const participant of participants) {
      debug.log(`Processing participant ${participant.id}`);

      // Find entries with posts
      const entriesWithPosts = participant.roundEntries.filter(entry => entry.postId);

      if (entriesWithPosts.length === 0) {
        debug.log(`No entries with posts found for participant ${participant.id}`);
        continue;
      }

      debug.log(`Found ${entriesWithPosts.length} entries with posts`);

      // Create a map to store the original posts for each round
      // We need to preserve the exact post that was uploaded to each specific round
      const postsByRoundId = new Map();
      const postsByRoundName = new Map();

      // First, process entries in order of creation date (oldest first)
      // This ensures we get the original post for each round
      const sortedByCreation = [...entriesWithPosts].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Map each post to its round ID and round name
      sortedByCreation.forEach(entry => {
        if (entry.postId && entry.post && entry.roundId && entry.round) {
          // Always keep the original post for each round
          if (!postsByRoundId.has(entry.roundId)) {
            debug.log(`Mapping post ${entry.postId} to round ${entry.roundId} (${entry.round.name})`);
            postsByRoundId.set(entry.roundId, {
              postId: entry.postId,
              post: entry.post
            });
          }

          // Also map by round name to handle renamed rounds
          if (!postsByRoundName.has(entry.round.name)) {
            debug.log(`Mapping post ${entry.postId} to round name "${entry.round.name}"`);
            postsByRoundName.set(entry.round.name, {
              postId: entry.postId,
              post: entry.post,
              roundId: entry.roundId
            });
          }
        }
      });

      debug.log(`Mapped ${postsByRoundId.size} posts to specific round IDs`);
      debug.log(`Mapped ${postsByRoundName.size} posts to specific round names`);

      // Get the competition rounds
      const competitionRounds = await prisma.competitionRound.findMany({
        where: { competitionId: id },
        orderBy: { startDate: 'asc' }
      });

      // Ensure there's an entry for each round
      for (const round of competitionRounds) {
        // Check if there's already an entry for this round
        const existingEntry = participant.roundEntries.find(entry => entry.roundId === round.id);

        // First try to get the post by round ID
        let roundPost = postsByRoundId.get(round.id);

        // If not found by ID, try to get by round name (handles renamed rounds)
        if (!roundPost) {
          roundPost = postsByRoundName.get(round.name);
          if (roundPost) {
            debug.log(`Found post ${roundPost.postId} for round "${round.name}" by name matching`);
          }
        }

        // If we don't have a post for this round, we'll still check if there's an existing entry
        // This ensures we don't lose entries during the rebuild process
        if (!roundPost) {
          debug.log(`No post found for round ${round.id} (${round.name})`);

          // If there's an existing entry with a post, we should preserve it
          if (existingEntry && existingEntry.postId) {
            debug.log(`Found existing entry with post ${existingEntry.postId} for round ${round.name} - preserving it`);
            try {
              await prisma.competitionRoundEntry.update({
                where: { id: existingEntry.id },
                data: {
                  visibleInCompetitionFeed: true,
                  visibleInNormalFeed: true,
                  updatedAt: new Date(),
                },
              });
              debug.log(`Preserved existing post ${existingEntry.postId} for round ${round.name}`);
            } catch (error) {
              debug.error(`Error updating entry ${existingEntry.id}:`, error);
            }
          }

          // Continue to the next round if we don't have a post to add
          continue;
        }

        if (existingEntry) {
          // If the entry already has a post, ALWAYS keep it
          if (existingEntry.postId) {
            // Just ensure visibility flags are set correctly
            try {
              await prisma.competitionRoundEntry.update({
                where: { id: existingEntry.id },
                data: {
                  // Check if the round has started
                  visibleInCompetitionFeed: new Date(round.startDate) <= new Date(),
                  visibleInNormalFeed: new Date(round.startDate) <= new Date(),
                  updatedAt: new Date(),
                },
              });
              debug.log(`Preserved existing post ${existingEntry.postId} for round ${round.name}`);
            } catch (error) {
              debug.error(`Error updating entry ${existingEntry.id}:`, error);
            }
          } else if (roundPost) {
            // If the entry doesn't have a post but we found a post for this round, update it
            try {
              await prisma.competitionRoundEntry.update({
                where: { id: existingEntry.id },
                data: {
                  postId: roundPost.postId,
                  // Check if the round has started
                  visibleInCompetitionFeed: new Date(round.startDate) <= new Date(),
                  visibleInNormalFeed: new Date(round.startDate) <= new Date(),
                  updatedAt: new Date(),
                },
              });
              debug.log(`Updated entry ${existingEntry.id} for round ${round.name} with post ${roundPost.postId}`);
            } catch (error) {
              debug.error(`Error updating entry ${existingEntry.id}:`, error);
            }
          } else {
            // Entry has no post and we didn't find a post for this round
            debug.log(`Entry ${existingEntry.id} for round ${round.name} has no post and no post was found for this round`);
          }
        } else if (roundPost) {
          // Create a new entry for this round with the specific post for this round
          try {
            await prisma.competitionRoundEntry.create({
              data: {
                participantId: participant.id,
                roundId: round.id,
                postId: roundPost.postId,
                // Check if the round has started
                visibleInCompetitionFeed: new Date(round.startDate) <= new Date(),
                visibleInNormalFeed: new Date(round.startDate) <= new Date(),
              },
            });
            debug.log(`Created new entry for round ${round.name} with post ${roundPost.postId}`);
          } catch (error) {
            debug.error(`Error creating entry for round ${round.name}:`, error);
          }
        }
      }
    }

    // Force refresh the competition cache by touching the competition record
    await prisma.competition.update({
      where: { id },
      data: {
        updatedAt: new Date()
      }
    });
    debug.log('Updated competition timestamp to refresh cache');
  } catch (syncError) {
    debug.error('Error rebuilding entries after competition update:', syncError);
    // Continue without failing the whole update
  }

  debug.log('Returning updated competition:', competition);
  return competition;
}

export async function toggleCompetitionStatus(id: string, isActive: boolean) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const competition = await prisma.competition.update({
    where: { id },
    data: { isActive },
  });

  return competition;
}

export async function deleteCompetition(id: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Use a transaction to ensure all related data is deleted
  return await prisma.$transaction(async (tx) => {
    // 1. Get all round IDs for this competition
    const rounds = await tx.competitionRound.findMany({
      where: { competitionId: id },
      select: { id: true },
    });

    const roundIds = rounds.map(round => round.id);

    // 2. Get all participant IDs for this competition
    const participants = await tx.competitionParticipant.findMany({
      where: { competitionId: id },
      select: { id: true },
    });

    const participantIds = participants.map(participant => participant.id);

    // 3. Delete all round entries
    if (roundIds.length > 0) {
      await tx.competitionRoundEntry.deleteMany({
        where: {
          roundId: { in: roundIds },
        },
      });
    }

    // 4. Delete all participant entries
    if (participantIds.length > 0) {
      await tx.competitionRoundEntry.deleteMany({
        where: {
          participantId: { in: participantIds },
        },
      });
    }

    // 5. Delete all prize payments
    try {
      await tx.prizePayment.deleteMany({
        where: { competitionId: id },
      });
    } catch (error) {
      debug.error('Error deleting prize payments:', error);
      // Continue without deleting prize payments
    }

    // 6. Delete all prizes
    try {
      await tx.competitionPrize.deleteMany({
        where: { competitionId: id },
      });
    } catch (error) {
      debug.error('Error deleting prizes:', error);
      // Continue without deleting prizes
    }

    // 7. Delete all participants
    await tx.competitionParticipant.deleteMany({
      where: { competitionId: id },
    });

    // 8. Delete all rounds
    await tx.competitionRound.deleteMany({
      where: { competitionId: id },
    });

    // 9. Finally, delete the competition
    await tx.competition.delete({
      where: { id },
    });

    return { success: true };
  });
}

export async function disqualifyParticipant(competitionId: string, participantId: string, reason: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  if (!reason.trim()) {
    throw new Error("Disqualification reason is required");
  }

  // Update participant
  const participant = await prisma.competitionParticipant.update({
    where: { id: participantId },
    data: {
      isDisqualified: true,
      disqualifyReason: reason,
    },
  });

  return participant;
}

export async function toggleCompetitionMediaDisplay(id: string, showStickeredMedia: boolean) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const competition = await prisma.competition.update({
    where: { id },
    data: { showStickeredMedia },
  });

  return competition;
}

export async function toggleCompetitionFeedStickers(id: string, showFeedStickers: boolean) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const competition = await prisma.competition.update({
    where: { id },
    data: { showFeedStickers },
  });

  return competition;
}

