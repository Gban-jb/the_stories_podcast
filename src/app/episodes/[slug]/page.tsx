import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEpisodeBySlug,
  getAdjacentEpisodes,
  getRelatedEpisodes,
  getAllEpisodeSlugs,
} from "@/lib/episodes";
import { site, primaryChannel } from "@/lib/site";
import { formatDate, formatDuration, formatEpisodeNumber, compactNumber } from "@/lib/format";
import { renderNotes, renderTranscript } from "@/lib/markdown";
import { EpisodePlayer } from "@/components/episode-player";
import { EpisodeCard } from "@/components/episode-card";
import { ShareLinks } from "@/components/share-links";
import { SubscribeForm } from "@/components/subscribe-form";

export const revalidate = 600;

/** Pre-render the archive at build time; new episodes fill in on first request. */
export async function generateStaticParams() {
  const episodes = await getAllEpisodeSlugs().catch(() => []);
  return episodes.slice(0, 100).map((e) => ({ slug: e.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) return { title: "Episode not found" };

  const number = formatEpisodeNumber(episode.number);
  const description =
    episode.blurb ?? episode.description?.slice(0, 200) ?? site.description;

  return {
    title: number ? `${number} — ${episode.title}` : episode.title,
    description,
    alternates: { canonical: `/episodes/${episode.slug}` },
    openGraph: {
      type: "video.episode",
      title: episode.title,
      description,
      url: `/episodes/${episode.slug}`,
      images: episode.thumbnailUrl ? [{ url: episode.thumbnailUrl }] : undefined,
      releaseDate: episode.publishedAt.toISOString(),
    },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) notFound();

  const [{ newer, older }, related] = await Promise.all([
    getAdjacentEpisodes(episode),
    getRelatedEpisodes(episode.id, episode.tags.map((t) => t.slug)),
  ]);

  const number = formatEpisodeNumber(episode.number);
  const url = `${site.url}/episodes/${episode.slug}`;

  // Structured data so the episode can surface as a video result in search.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.blurb ?? episode.description ?? undefined,
    datePublished: episode.publishedAt.toISOString(),
    url,
    thumbnailUrl: episode.thumbnailUrl ?? undefined,
    timeRequired: `PT${Math.round(episode.durationSeconds / 60)}M`,
    partOfSeries: { "@type": "PodcastSeries", name: site.name, url: site.url },
    associatedMedia: {
      "@type": "VideoObject",
      embedUrl: `https://www.youtube-nocookie.com/embed/${episode.youtubeId}`,
    },
  };

  return (
    <article className="pt-12 md:pt-16">
      <script
        type="application/ld+json"
        // Serialised object built above, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="shell">
        <Link href="/episodes" className="label text-dust transition-colors hover:text-signal">
          ← All episodes
        </Link>

        <div className="label mt-8 flex flex-wrap items-center gap-3 text-dust-deep">
          {number && <span className="text-signal">{number}</span>}
          {number && <span aria-hidden="true">·</span>}
          <span>{formatDate(episode.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="timecode normal-case tracking-normal">
            {formatDuration(episode.durationSeconds)}
          </span>
          {episode.viewCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="timecode normal-case tracking-normal">
                {compactNumber(episode.viewCount)} views
              </span>
            </>
          )}
        </div>

        <h1 className="mt-5 max-w-4xl text-title font-display">{episode.title}</h1>

        {episode.blurb && (
          <p className="mt-6 max-w-2xl text-lede text-bone-dim">{episode.blurb}</p>
        )}
      </header>

      <div className="shell mt-12 grid gap-14 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <div className="min-w-0">
          <EpisodePlayer
            episodeId={episode.id}
            youtubeId={episode.youtubeId}
            title={episode.title}
            thumbnailUrl={episode.thumbnailUrl}
            durationSeconds={episode.durationSeconds}
            chapters={episode.chapters}
          />

          {episode.showNotes ? (
            <section className="mt-16">
              <h2 className="label text-dust-deep">Show notes</h2>
              <div
                className="mt-5 max-w-prose text-bone-dim"
                dangerouslySetInnerHTML={{ __html: renderNotes(episode.showNotes) }}
              />
            </section>
          ) : episode.description ? (
            <section className="mt-16">
              <h2 className="label text-dust-deep">From YouTube</h2>
              <p className="mt-5 max-w-prose whitespace-pre-line leading-relaxed text-dust">
                {episode.description}
              </p>
            </section>
          ) : null}

          {episode.transcript && (
            <section className="mt-16">
              <details className="group border-t border-ink-edge pt-6">
                <summary className="label flex cursor-pointer items-center justify-between text-dust transition-colors hover:text-signal">
                  Full transcript
                  <span className="transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div
                  className="mt-6 max-w-prose text-sm text-dust"
                  dangerouslySetInnerHTML={{ __html: renderTranscript(episode.transcript) }}
                />
              </details>
            </section>
          )}
        </div>

        <aside className="space-y-12 lg:sticky lg:top-28 lg:self-start">
          {episode.guests.length > 0 && (
            <section>
              <h2 className="label text-dust-deep">In this episode</h2>
              <ul className="mt-4 space-y-5">
                {episode.guests.map((guest) => (
                  <li key={guest.id}>
                    <p className="font-display text-xl">{guest.name}</p>
                    {guest.bio && (
                      <p className="mt-1.5 text-sm leading-relaxed text-dust">{guest.bio}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {episode.tags.length > 0 && (
            <section>
              <h2 className="label text-dust-deep">Themes</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {episode.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/episodes?tag=${tag.slug}`}
                    className="label border border-ink-edge-strong px-3 py-2 text-dust transition-colors hover:border-signal hover:text-signal"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <ShareLinks url={url} title={episode.title} />

          <section className="border-t border-ink-edge pt-8">
            <h2 className="font-display text-xl">Don&apos;t miss the next one</h2>
            <p className="mt-2 text-sm text-dust">
              New episodes {site.cadence}, on {primaryChannel.label} first.
            </p>
            <div className="mt-5">
              <SubscribeForm source={`episode:${episode.slug}`} />
            </div>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="shell mt-28">
          <h2 className="label text-dust-deep">Related stories</h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => (
              <EpisodeCard key={e.id} episode={e} />
            ))}
          </div>
        </section>
      )}

      <nav
        className="shell mt-24 grid gap-px border border-ink-edge bg-ink-edge sm:grid-cols-2"
        aria-label="Nearby episodes"
      >
        {older ? (
          <Link href={`/episodes/${older.slug}`} className="group bg-ink p-7 transition-colors hover:bg-ink-raised">
            <span className="label text-dust-deep">← The one before</span>
            <span className="mt-3 block font-display text-2xl transition-colors group-hover:text-signal">
              {older.title}
            </span>
          </Link>
        ) : (
          <span className="bg-ink p-7">
            <span className="label text-dust-deep">This is the first one</span>
          </span>
        )}

        {newer ? (
          <Link
            href={`/episodes/${newer.slug}`}
            className="group bg-ink p-7 text-right transition-colors hover:bg-ink-raised"
          >
            <span className="label text-dust-deep">The one after →</span>
            <span className="mt-3 block font-display text-2xl transition-colors group-hover:text-signal">
              {newer.title}
            </span>
          </Link>
        ) : (
          <span className="bg-ink p-7 text-right">
            <span className="label text-dust-deep">This is the latest</span>
          </span>
        )}
      </nav>
    </article>
  );
}
