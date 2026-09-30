"use client";

import { useEffect, useRef, useState } from "react";
import { EpisodeStill } from "./episode-still";
import { formatDuration, spokenDuration } from "@/lib/format";

/**
 * A facade over the YouTube iframe: we show our own still and play control, and
 * only mount YouTube's player once someone asks for it. That keeps ~1.5MB of
 * third-party script off first load and means YouTube sets no cookies until the
 * viewer has actually chosen to watch.
 */
export function YouTubeEmbed({
  youtubeId,
  title,
  thumbnailUrl,
  durationSeconds,
  /** Jump straight to this point when play is pressed. */
  startSeconds = 0,
  priority = false,
  className = "",
}: {
  youtubeId: string;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number;
  startSeconds?: number;
  priority?: boolean;
  className?: string;
}) {
  const [playRequested, setPlayRequested] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /**
   * The player is open once someone presses play, or as soon as the parent
   * points at a chapter. Both are derived from what we already have, so a
   * chapter change seeks by remounting the iframe (see `key`) without any
   * state to keep in step.
   */
  const start = startSeconds;
  const active = playRequested || start > 0;

  // Move focus into the player when it opens, so keyboard users land on it.
  useEffect(() => {
    if (active) frameRef.current?.focus();
  }, [active]);


  const src = new URL(`https://www.youtube-nocookie.com/embed/${youtubeId}`);
  src.searchParams.set("autoplay", "1");
  src.searchParams.set("rel", "0");
  src.searchParams.set("modestbranding", "1");
  if (start > 0) src.searchParams.set("start", String(start));

  return (
    <div
      className={`group relative aspect-video w-full overflow-hidden bg-ink-sunk ${className}`}
    >
      {active ? (
        <iframe
          ref={frameRef}
          key={start}
          src={src.toString()}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlayRequested(true)}
          className="absolute inset-0 size-full cursor-pointer"
          aria-label={`Play ${title}${
            durationSeconds ? `, ${spokenDuration(durationSeconds)}` : ""
          }`}
        >
          <EpisodeStill
            src={thumbnailUrl}
            seed={youtubeId}
            priority={priority}
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover opacity-80 saturate-[0.85] transition duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.02] group-hover:opacity-100 group-hover:saturate-100"
          />
          {/* Weight the bottom so the runtime badge stays legible on any still. */}
          <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-20 place-items-center rounded-full border border-signal/40 bg-ink/60 backdrop-blur-sm transition duration-500 ease-[var(--ease-out-soft)] group-hover:border-signal group-hover:bg-signal group-hover:text-ink sm:size-24">
              <svg viewBox="0 0 24 24" className="ml-1 size-7 fill-current" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>

          {durationSeconds ? (
            <span className="timecode absolute right-3 bottom-3 bg-ink/80 px-2 py-1 text-xs text-bone">
              {formatDuration(durationSeconds)}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
