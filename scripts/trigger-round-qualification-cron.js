// Script to manually trigger the round qualification cron job for testing
// Usage: node scripts/trigger-round-qualification-cron.js

const fetch = require('node-fetch');

async function triggerRoundQualificationCron() {
  console.log('🔄 Triggering Round Qualification Cron Job');
  console.log('==========================================\n');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET;
    
    console.log(`📡 Calling: ${baseUrl}/api/cron/process-round-qualifications`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if cron secret is available
    if (cronSecret) {
      headers['Authorization'] = `Bearer ${cronSecret}`;
      console.log('🔐 Using CRON_SECRET for authentication');
    } else {
      console.log('⚠️  No CRON_SECRET found - proceeding without authentication');
    }

    const response = await fetch(`${baseUrl}/api/cron/process-round-qualifications`, {
      method: 'GET',
      headers,
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Cron job executed successfully!\n');
      console.log('📊 Results:');
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.processedCompetitions && result.processedCompetitions.length > 0) {
        console.log('\n🏆 Processed Competitions:');
        result.processedCompetitions.forEach((comp, index) => {
          console.log(`\n${index + 1}. ${comp.competitionTitle}`);
          console.log(`   Competition ID: ${comp.competitionId}`);
          console.log(`   Round: ${comp.roundName} (${comp.roundId})`);
          console.log(`   Result: ${comp.result}`);
          
          if (comp.completionReason) {
            console.log(`   🏁 Completion: ${comp.completionReason}`);
          }
        });
      } else {
        console.log('\n📝 No competitions needed processing');
      }
    } else {
      console.log('❌ Cron job failed!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || result.message}`);
      
      if (result.error) {
        console.log(`   Details: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error triggering cron job:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js server is running:');
      console.log('   npm run dev');
      console.log('   or');
      console.log('   npm run start');
    }
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking server status...');
  
  const serverRunning = await checkServerHealth();
  
  if (!serverRunning) {
    console.log('❌ Server is not running or not responding');
    console.log('\n💡 Please start your Next.js server first:');
    console.log('   cd nextjs');
    console.log('   npm run dev');
    console.log('\nThen run this script again.');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await triggerRoundQualificationCron();
}

main().catch(console.error);
