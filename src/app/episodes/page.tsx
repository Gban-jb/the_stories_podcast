import type { Metadata } from "next";
import Link from "next/link";
import { searchEpisodes, getAllTags, getRuntimeSeries } from "@/lib/episodes";
import { EpisodeCard } from "@/components/episode-card";
import { EpisodeFilters } from "@/components/episode-filters";
import { WaveformDivider } from "@/components/waveform-divider";
import { NoEpisodes } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Episodes",
  description: "Every episode, searchable by title, show notes and transcript.",
};

export const revalidate = 600;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = one(params.q);
  const tag = one(params.tag);
  const sort = one(params.sort);
  const page = Number(one(params.page) ?? 1) || 1;

  const [result, tags, runtimes] = await Promise.all([
    searchEpisodes({ query, tag, sort, page, perPage: 12 }),
    getAllTags(),
    getRuntimeSeries(),
  ]);

  // Nothing in the database at all is a different problem from nothing matching.
  if (result.total === 0 && !query && !tag) return <NoEpisodes />;

  const buildPageHref = (n: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (tag) search.set("tag", tag);
    if (sort) search.set("sort", sort);
    if (n > 1) search.set("page", String(n));
    return `/episodes${search.size ? `?${search}` : ""}`;
  };

  return (
    <div className="pt-14 md:pt-20">
      <div className="shell">
        <p className="label text-dust-deep">Every episode</p>
        <h1 className="mt-4 max-w-3xl text-title font-display">
          The whole archive, searchable down to the transcript.
        </h1>
        <WaveformDivider runtimes={runtimes} className="mt-10" />
      </div>

      <div className="shell mt-12">
        <EpisodeFilters tags={tags} />
      </div>

      <div className="shell mt-10">
        <p className="label text-dust-deep" aria-live="polite">
          {result.total === 0
            ? "No matches"
            : `${result.total} episode${result.total === 1 ? "" : "s"}`}
          {query && ` for “${query}”`}
        </p>
      </div>

      {result.total === 0 ? (
        <div className="shell py-20">
          <h2 className="max-w-lg font-display text-2xl">
            Nothing matched that.
          </h2>
          <p className="mt-4 max-w-md text-dust">
            Try a shorter phrase, or clear the filters to see everything.
          </p>
          <Link
            href="/episodes"
            className="label mt-7 inline-block border border-ink-edge-strong px-5 py-3 text-bone transition-colors hover:border-signal hover:text-signal"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="shell mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {result.episodes.map((episode, i) => (
            <EpisodeCard key={episode.id} episode={episode} priority={i < 3} />
          ))}
        </div>
      )}

      {result.pageCount > 1 && (
        <nav
          className="shell mt-20 flex items-center justify-between gap-4 border-t border-ink-edge pt-8"
          aria-label="Pagination"
        >
          {result.page > 1 ? (
            <Link href={buildPageHref(result.page - 1)} className="label text-bone hover:text-signal">
              ← Newer
            </Link>
          ) : (
            <span className="label text-dust-deep">← Newer</span>
          )}

          <span className="timecode text-xs text-dust">
            {result.page} / {result.pageCount}
          </span>

          {result.page < result.pageCount ? (
            <Link href={buildPageHref(result.page + 1)} className="label text-bone hover:text-signal">
              Older →
            </Link>
          ) : (
            <span className="label text-dust-deep">Older →</span>
          )}
        </nav>
      )}
    </div>
  );
}
