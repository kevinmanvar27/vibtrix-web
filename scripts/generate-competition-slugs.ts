import { PrismaClient } from '@prisma/client';
import { generateCompetitionSlug } from '../src/lib/slug-utils';

const prisma = new PrismaClient();

async function generateSlugsForExistingCompetitions() {
  try {
    console.log('Starting to generate slugs for existing competitions...');

    // Get all competitions
    const competitions = await prisma.competition.findMany({
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    console.log(`Found ${competitions.length} competitions`);

    // Process each competition
    for (const competition of competitions) {
      if (competition.rounds.length === 0) {
        console.log(`Skipping competition ${competition.id} (${competition.title}) - no rounds found`);
        continue;
      }

      // Find the earliest start date and latest end date
      const startDates = competition.rounds.map(round => round.startDate);
      const endDates = competition.rounds.map(round => round.endDate);

      const earliestStartDate = new Date(Math.min(...startDates.map(d => d.getTime())));
      const latestEndDate = new Date(Math.max(...endDates.map(d => d.getTime())));

      // Generate the slug
      const slug = generateCompetitionSlug(competition.title, earliestStartDate, latestEndDate);

      try {
        // Update the competition with the new slug
        await prisma.$executeRaw`UPDATE competitions SET slug = ${slug} WHERE id = ${competition.id}`;
        console.log(`Updated competition ${competition.id} (${competition.title}) with slug: ${slug}`);
      } catch (updateError) {
        console.error(`Error updating competition ${competition.id}:`, updateError);
      }
    }

    console.log('Finished generating slugs for existing competitions');
  } catch (error) {
    console.error('Error generating slugs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
generateSlugsForExistingCompetitions();
