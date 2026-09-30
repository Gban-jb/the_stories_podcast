import { NextResponse } from "next/server";
import { syncFromYouTube, latestSyncRun } from "@/lib/sync";
import { isSignedIn, hasSyncSecret } from "@/lib/auth";
import { youtubeConfigured } from "@/lib/env";

/** A full channel sync takes a while on a large archive. */
export const maxDuration = 300;

/**
 * Trigger a sync. Accepts either an admin browser session or a bearer token in
 * SYNC_SECRET, so a cron job can call it without logging in.
 */
export async function POST(request: Request) {
  const authorised =
    (await isSignedIn()) || hasSyncSecret(request.headers.get("authorization"));

  if (!authorised) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  if (!youtubeConfigured) {
    return NextResponse.json(
      {
        error:
          "YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID must both be set before a sync can run.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await syncFromYouTube();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    console.error("POST /api/sync failed", error);
    // The message is ours (from lib/youtube), safe to hand back to the operator.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** Last run's outcome, for the admin page and for uptime checks. */
export async function GET() {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  return NextResponse.json({ latest: await latestSyncRun() });
}
