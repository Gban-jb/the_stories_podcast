import Link from "next/link";
import { youtubeConfigured } from "@/lib/env";

/**
 * A fresh install has no episodes. Say what to do next rather than showing an
 * empty grid and letting the operator guess.
 */
export function NoEpisodes() {
  return (
    <div className="shell py-24 md:py-32">
      <p className="label text-dust-deep">Nothing here yet</p>
      <h2 className="mt-5 max-w-2xl text-title font-display">
        No episodes have been pulled in from YouTube.
      </h2>
      <div className="mt-8 max-w-xl space-y-4 text-dust">
        {youtubeConfigured ? (
          <p>
            The channel is configured. Run a sync from{" "}
            <Link href="/admin" className="text-signal underline underline-offset-4">
              the admin page
            </Link>{" "}
            to mirror its videos into the site.
          </p>
        ) : (
          <>
            <p>
              Set <code className="timecode text-cassette">YOUTUBE_API_KEY</code> and{" "}
              <code className="timecode text-cassette">YOUTUBE_CHANNEL_ID</code> in{" "}
              <code className="timecode text-cassette">.env</code>, then run a sync.
            </p>
            <p className="text-sm text-dust-deep">
              README → “Connect the YouTube channel” has the two commands.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
