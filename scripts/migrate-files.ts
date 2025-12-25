import { migrateAllFiles } from "../src/lib/migrationUtils";
import { ensureUploadDirectories } from "../src/lib/fileStorage";

/**
 * Script to migrate all files from UploadThing to local storage
 * Run with: npx tsx scripts/migrate-files.ts
 */
async function main() {
  try {
    console.log("Starting migration of files from UploadThing to local storage...");
    
    // Ensure all upload directories exist
    await ensureUploadDirectories();
    
    // Migrate all files
    const result = await migrateAllFiles();
    
    console.log("Migration completed successfully!");
    console.log("Migration summary:");
    console.log(`- Avatars: ${result.avatars}`);
    console.log(`- Media files: ${result.media}`);
    console.log(`- Stickers: ${result.stickers}`);
    console.log(`- Total files migrated: ${result.total}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
