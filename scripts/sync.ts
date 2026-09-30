/**
 * Sync the channel from a terminal or a cron job, without going through the
 * admin page. Usage: npm run sync
 */
import "dotenv/config";
import { syncFromYouTube } from "../src/lib/sync";

async function main() {
  console.log("Pulling from YouTube…");
  const result = await syncFromYouTube();
  console.log(
    `${result.added} added, ${result.updated} updated, ${result.skipped} skipped (under 3 minutes), ${result.total} videos seen.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
