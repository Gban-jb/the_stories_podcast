"use client";

import { useState } from "react";
import { YouTubeEmbed } from "./youtube-embed";
import { Waveform } from "./waveform";
import { formatDuration } from "@/lib/format";

type Chapter = { id: string; startSeconds: number; title: string };

/**
 * Player plus chapter list. Chapters are the episode's real structure — a story
 * has turns — so they get to be navigation, not a table of contents.
 */
export function EpisodePlayer({
  episodeId,
  youtubeId,
  title,
  thumbnailUrl,
  durationSeconds,
  chapters,
}: {
  episodeId: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  chapters: Chapter[];
}) {
  const [startSeconds, setStartSeconds] = useState(0);

  const marks = chapters.map(
    (c) => c.startSeconds / Math.max(durationSeconds, 1),
  );

  return (
    <div>
      <YouTubeEmbed
        youtubeId={youtubeId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        durationSeconds={durationSeconds}
        startSeconds={startSeconds}
        priority
      />

      <Waveform
        seed={episodeId}
        count={128}
        marks={marks}
        progress={startSeconds > 0 ? startSeconds / Math.max(durationSeconds, 1) : undefined}
        heightClassName="h-14"
        className="mt-5"
      />

      {chapters.length > 0 && (
        <div className="mt-10">
          <h2 className="label text-dust-deep">Chapters</h2>
          <ol className="mt-4">
            {chapters.map((chapter) => {
              const active = startSeconds === chapter.startSeconds;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => setStartSeconds(chapter.startSeconds)}
                    aria-current={active ? "true" : undefined}
                    className={`group flex w-full items-baseline gap-5 border-b py-3.5 text-left transition-colors ${
                      active
                        ? "border-signal/50"
                        : "border-ink-edge hover:border-signal/30"
                    }`}
                  >
                    <span
                      className={`timecode shrink-0 text-xs ${
                        active ? "text-signal" : "text-cassette"
                      }`}
                    >
                      {formatDuration(chapter.startSeconds)}
                    </span>
                    <span
                      className={`text-sm transition-colors ${
                        active ? "text-signal" : "text-bone-dim group-hover:text-bone"
                      }`}
                    >
                      {chapter.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
