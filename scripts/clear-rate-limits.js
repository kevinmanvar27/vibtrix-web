#!/usr/bin/env node

/**
 * Clear Rate Limits Script
 * Clears all rate limit entries for development
 */

console.log('🔄 Clearing rate limit cache...');

// Since the rate limit store is in-memory, we just need to restart the server
// This script is mainly for documentation and future Redis integration

console.log('✅ Rate limits will be cleared on server restart');
console.log('💡 Tip: Restart the development server to apply new rate limits');

process.exit(0);
