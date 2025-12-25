import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditCompetitionClient from "./EditCompetitionClient";

export const metadata = {
  title: "Edit Competition",
};

interface EditCompetitionPageProps {
  params: {
    competitionId: string;
  };
}

async function getCompetition(id: string) {
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      rounds: {
        orderBy: {
          startDate: 'asc',
        },
      },
      prizes: true,
    },
  });

  if (!competition) {
    notFound();
  }

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

  // Format the dates for the form - use direct date values without timezone conversion
  return {
    ...competition,
    rounds: competition.rounds.map(round => {
      // Get the raw date objects from the database
      const startDate = round.startDate;
      const endDate = round.endDate;

      // Format date as YYYY-MM-DD for the date input (HTML5 date input format)
      const startYear = startDate.getFullYear();
      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const startDateStr = `${startYear}-${startMonth}-${startDay}`;

      const endYear = endDate.getFullYear();
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const endDateStr = `${endYear}-${endMonth}-${endDay}`;

      // Format time as HH:MM for the time input (HTML5 time input format)
      const startHours = startDate.getHours().toString().padStart(2, '0');
      const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
      const startTimeStr = `${startHours}:${startMinutes}`;

      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      const endTimeStr = `${endHours}:${endMinutes}`;

      return {
        ...round,
        startDate: startDateStr,
        endDate: endDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        // Store the original date objects for reference
        _originalStartDate: startDate,
        _originalEndDate: endDate
      };
    }),
  };
}

export default async function EditCompetitionPage({ params }: EditCompetitionPageProps) {
  const competition = await getCompetition(params.competitionId);

  // Determine competition lifecycle status
  const currentDate = new Date();
  let competitionStatus = "Upcoming";

  // Track which rounds have started or completed
  const startedRoundIds: string[] = [];

  if (competition.rounds.length > 0) {
    // Check each round's status
    competition.rounds.forEach(round => {
      // Use the original date objects stored during formatting
      if (round._originalStartDate <= currentDate) {
        // This round has started or completed
        startedRoundIds.push(round.id);
      }
    });

    // Check if any round has started
    const anyRoundStarted = startedRoundIds.length > 0;

    // Check if all rounds have ended
    const allRoundsEnded = competition.rounds.every(round => {
      // Use the original date objects stored during formatting
      return round._originalEndDate < currentDate;
    });

    if (anyRoundStarted) {
      if (allRoundsEnded) {
        competitionStatus = "Completed";
      } else {
        competitionStatus = "Active";
      }
    }
  }

  return (
    <EditCompetitionClient
      competition={competition}
      competitionStatus={competitionStatus as "Upcoming" | "Completed" | "Active"}
      startedRoundIds={startedRoundIds}
    />
  );
}
