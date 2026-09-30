"use client";

import { useState } from "react";
import Link from "next/link";
import { Waveform } from "./waveform";
import { YouTubeEmbed } from "./youtube-embed";
import { formatDate, formatDuration, formatEpisodeNumber } from "@/lib/format";

type Chapter = { id: string; startSeconds: number; title: string };

type HeroEpisode = {
  id: string;
  youtubeId: string;
  slug: string;
  number: number | null;
  title: string;
  blurb: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  publishedAt: Date;
  chapters: Chapter[];
};

/**
 * The hero opens on the most characteristic thing the show has: one story,
 * named, at its full length, ready to play. The waveform is its baseline —
 * the same mark that rules every section below.
 */
export function FeaturedHero({ episode }: { episode: HeroEpisode }) {
  const [startSeconds, setStartSeconds] = useState(0);

  const number = formatEpisodeNumber(episode.number);
  // Split on the natural break so each line gets its own mask reveal.
  const words = episode.title.split(" ");
  const mid = Math.ceil(words.length / 2);
  const lines =
    words.length > 3
      ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
      : [episode.title];

  const marks = episode.chapters.map(
    (c) => c.startSeconds / Math.max(episode.durationSeconds, 1),
  );

  return (
    <section className="relative pt-10 pb-0 md:pt-16">
      <div className="shell">
        <div className="label enters flex flex-wrap items-center gap-3 text-dust-deep">
          <span className="inline-flex items-center gap-2 text-peak">
            <span className="lamp-pulse size-1.5 rounded-full bg-peak" aria-hidden="true" />
            Latest
          </span>
          <span aria-hidden="true">·</span>
          {number && <span className="text-signal">{number}</span>}
          {number && <span aria-hidden="true">·</span>}
          <span>{formatDate(episode.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="timecode normal-case tracking-normal">
            {formatDuration(episode.durationSeconds)}
          </span>
        </div>

        <h1 className="mt-6 text-display font-display">
          {lines.map((line, i) => (
            <span key={i} className="line-mask">
              <span style={{ animationDelay: `${0.08 + i * 0.12}s` }}>{line}</span>
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:gap-14">
          <div className="enters" style={{ animationDelay: "0.35s" }}>
            <YouTubeEmbed
              youtubeId={episode.youtubeId}
              title={episode.title}
              thumbnailUrl={episode.thumbnailUrl}
              durationSeconds={episode.durationSeconds}
              startSeconds={startSeconds}
              priority
            />
          </div>

          <div className="enters flex flex-col" style={{ animationDelay: "0.45s" }}>
            {episode.blurb && (
              <p className="text-lede text-bone-dim">{episode.blurb}</p>
            )}

            {episode.chapters.length > 0 && (
              <div className="mt-8">
                <p className="label text-dust-deep">Start anywhere</p>
                <ul className="mt-4 space-y-px">
                  {episode.chapters.slice(0, 5).map((chapter) => (
                    <li key={chapter.id}>
                      <button
                        type="button"
                        onClick={() => setStartSeconds(chapter.startSeconds)}
                        className="group flex w-full items-baseline gap-4 border-b border-ink-edge py-3 text-left transition-colors hover:border-signal/40"
                      >
                        <span className="timecode shrink-0 text-xs text-cassette">
                          {formatDuration(chapter.startSeconds)}
                        </span>
                        <span className="text-sm text-bone-dim transition-colors group-hover:text-signal">
                          {chapter.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/episodes/${episode.slug}`}
              className="label mt-8 inline-flex w-fit items-center gap-2 border-b border-signal/40 pb-1.5 text-signal transition-colors hover:border-signal"
            >
              Notes and transcript
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* The hero's baseline: this episode's own shape, drawn once on load. */}
      <div className="shell mt-14">
        <Waveform
          seed={episode.id}
          count={128}
          marks={marks}
          animate
          heightClassName="h-20 md:h-28"
        />
      </div>
    </section>
  );
}
