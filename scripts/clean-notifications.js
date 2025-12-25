// This is a simple wrapper script to run the notification cleanup
const { execSync } = require('child_process');

try {
  console.log('Running notification cleanup script...');
  execSync('node scripts/clean-duplicate-notifications.js', { stdio: 'inherit' });
  console.log('Notification cleanup completed successfully');
} catch (error) {
  console.error('Error running notification cleanup script:', error);
  process.exit(1);
}
