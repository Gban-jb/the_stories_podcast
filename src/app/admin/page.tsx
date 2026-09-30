import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { isSignedIn } from "@/lib/auth";
import { adminConfigured, youtubeConfigured } from "@/lib/env";
import { latestSyncRun } from "@/lib/sync";
import { signOutAction } from "./actions";
import { AdminSyncButton } from "@/components/admin-sync-button";
import { AdminEpisodeForm } from "@/components/admin-episode-form";
import { formatDate, formatDuration, formatEpisodeNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Always render fresh: this page exists to show current state. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminConfigured) {
    return (
      <div className="shell py-24">
        <p className="label text-peak">Admin is off</p>
        <h1 className="mt-4 max-w-2xl text-title font-display">
          Set a password to turn the admin on.
        </h1>
        <p className="mt-6 max-w-xl text-dust">
          Add <code className="timecode text-cassette">ADMIN_PASSWORD</code> and{" "}
          <code className="timecode text-cassette">ADMIN_SESSION_SECRET</code> to your
          environment, then reload. Until both are set there is no way to sign in,
          which is why this page can be reached without one.
        </p>
      </div>
    );
  }

  if (!(await isSignedIn())) redirect("/admin/login");

  const [episodes, lastRun, counts, subscribers] = await Promise.all([
    db.episode.findMany({
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: {
        id: true,
        slug: true,
        number: true,
        title: true,
        blurb: true,
        showNotes: true,
        transcript: true,
        status: true,
        featured: true,
        durationSeconds: true,
        publishedAt: true,
      },
    }),
    latestSyncRun(),
    db.episode.groupBy({ by: ["status"], _count: { _all: true } }),
    db.subscriber.count(),
  ]);

  const countFor = (status: string) =>
    counts.find((c) => c.status === status)?._count._all ?? 0;

  return (
    <div className="shell py-14">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="label text-dust-deep">Admin</p>
          <h1 className="mt-3 font-display text-4xl">The desk</h1>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="label border border-ink-edge-strong px-4 py-3 text-dust transition-colors hover:border-peak hover:text-peak"
          >
            Sign out
          </button>
        </form>
      </div>

      <dl className="mt-10 grid gap-px border border-ink-edge bg-ink-edge sm:grid-cols-4">
        {[
          { label: "Published", value: countFor("PUBLISHED") },
          { label: "Draft", value: countFor("DRAFT") },
          { label: "Hidden", value: countFor("HIDDEN") },
          { label: "Subscribers", value: subscribers },
        ].map((stat) => (
          <div key={stat.label} className="bg-ink p-6">
            <dt className="label text-dust-deep">{stat.label}</dt>
            <dd className="mt-2 font-display text-3xl text-signal">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-14 border border-ink-edge p-7">
        <h2 className="font-display text-2xl">Mirror the channel</h2>
        <p className="mt-3 max-w-2xl text-sm text-dust">
          A sync pulls titles, stills, runtimes, stats and chapter timestamps from
          YouTube. Blurbs, show notes, transcripts and the featured flag are
          written here and a sync never overwrites them.
        </p>

        {!youtubeConfigured && (
          <p className="mt-5 text-sm text-peak">
            <code className="timecode">YOUTUBE_API_KEY</code> and{" "}
            <code className="timecode">YOUTUBE_CHANNEL_ID</code> aren&apos;t set, so sync
            is unavailable.
          </p>
        )}

        <div className="mt-6">
          <AdminSyncButton disabled={!youtubeConfigured} />
        </div>

        {lastRun && (
          <p className="mt-6 text-xs text-dust-deep">
            Last run {formatDate(lastRun.startedAt)} ·{" "}
            <span className={lastRun.status === "error" ? "text-peak" : "text-cassette"}>
              {lastRun.status}
            </span>
            {lastRun.status === "ok" &&
              ` · ${lastRun.added} added, ${lastRun.updated} updated`}
            {lastRun.error && ` · ${lastRun.error}`}
          </p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl">Episodes</h2>
        <p className="mt-2 text-sm text-dust">
          The 30 most recent. Expand one to write its notes.
        </p>

        {episodes.length === 0 ? (
          <p className="mt-8 text-dust">
            Nothing here yet — run a sync above.
          </p>
        ) : (
          <ul className="mt-8 space-y-px">
            {episodes.map((episode) => (
              <li key={episode.id} className="border border-ink-edge bg-ink-raised">
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 p-5 hover:bg-ink">
                    <span className="timecode shrink-0 text-xs text-signal-deep">
                      {formatEpisodeNumber(episode.number) ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-lg">
                      {episode.title}
                    </span>

                    {episode.featured && (
                      <span className="label shrink-0 text-signal">Featured</span>
                    )}
                    <span
                      className={`label shrink-0 ${
                        episode.status === "PUBLISHED" ? "text-cassette" : "text-peak"
                      }`}
                    >
                      {episode.status.toLowerCase()}
                    </span>
                    <span className="timecode shrink-0 text-xs text-dust-deep">
                      {formatDuration(episode.durationSeconds)}
                    </span>
                    <span
                      className="shrink-0 text-dust transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>

                  <div className="border-t border-ink-edge p-5">
                    <Link
                      href={`/episodes/${episode.slug}`}
                      className="label text-dust transition-colors hover:text-signal"
                    >
                      View on the site ↗
                    </Link>
                    <div className="mt-6">
                      <AdminEpisodeForm episode={episode} />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
