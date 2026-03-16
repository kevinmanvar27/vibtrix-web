// This script lists all competitions
// Usage: node scripts/list-competitions.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('📋 Competition List');
    console.log('==================\n');

    // Find all competitions with detailed information
    const competitions = await prisma.competition.findMany({
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${competitions.length} competitions\n`);

    // Print the competitions with detailed info
    competitions.forEach((competition, index) => {
      const currentDate = new Date();
      const allRoundsEnded = competition.rounds.every(round =>
        new Date(round.endDate) < currentDate
      );
      const firstRoundEnded = competition.rounds.length > 0 &&
        new Date(competition.rounds[0].endDate) < currentDate;

      console.log(`${index + 1}. ${competition.title}`);
      console.log(`   ID: ${competition.id}`);
      console.log(`   Status: ${competition.isActive ? 'Active' : 'Inactive'}`);
      console.log(`   Participants: ${competition._count.participants}`);
      console.log(`   Rounds: ${competition.rounds.length}`);
      console.log(`   Entry Fee: ${competition.isPaid ? `₹${competition.entryFee}` : 'Free'}`);

      if (competition.completionReason) {
        console.log(`   Completion: ${competition.completionReason}`);
      }

      if (competition.rounds.length > 0) {
        const firstRound = competition.rounds[0];
        const lastRound = competition.rounds[competition.rounds.length - 1];
        console.log(`   Duration: ${new Date(firstRound.startDate).toLocaleDateString()} - ${new Date(lastRound.endDate).toLocaleDateString()}`);

        if (firstRoundEnded) {
          console.log(`   ⏰ First round ended`);
        }

        if (allRoundsEnded) {
          console.log(`   🏁 All rounds completed`);
        }
      }

      console.log('');
    });

    // Show summary
    const activeCompetitions = competitions.filter(c => c.isActive);
    const completedCompetitions = competitions.filter(c => !c.isActive || c.completionReason);

    console.log('📊 Summary:');
    console.log(`   Active: ${activeCompetitions.length}`);
    console.log(`   Completed: ${completedCompetitions.length}`);

    if (activeCompetitions.length > 0) {
      console.log('\n🔍 Active competitions for testing:');
      activeCompetitions.forEach(comp => {
        console.log(`   • ${comp.title} (${comp.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error listing competitions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
