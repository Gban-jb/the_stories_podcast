import Link from "next/link";
import { EpisodeStill } from "./episode-still";
import type { EpisodeCard as EpisodeCardData } from "@/lib/episodes";
import { formatDate, formatDuration, formatEpisodeNumber } from "@/lib/format";

export function EpisodeCard({
  episode,
  priority = false,
}: {
  episode: EpisodeCardData;
  priority?: boolean;
}) {
  const number = formatEpisodeNumber(episode.number);

  return (
    <article className="group">
      <Link href={`/episodes/${episode.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-ink-sunk">
          <EpisodeStill
            src={episode.thumbnailUrl}
            seed={episode.id}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-75 saturate-[0.8] transition duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03] group-hover:opacity-100 group-hover:saturate-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

          {/* Runtime slides up on hover — present when wanted, quiet otherwise. */}
          <span className="timecode absolute right-2.5 bottom-2.5 translate-y-1 bg-ink/85 px-2 py-1 text-[0.6875rem] text-bone opacity-0 transition duration-400 ease-[var(--ease-out-soft)] group-hover:translate-y-0 group-hover:opacity-100">
            {formatDuration(episode.durationSeconds)}
          </span>
        </div>

        <div className="mt-4">
          <div className="label flex items-center gap-2.5 text-dust-deep">
            {number && <span className="text-signal-deep">{number}</span>}
            {number && <span aria-hidden="true">·</span>}
            <span>{formatDate(episode.publishedAt)}</span>
          </div>

          <h3 className="mt-2.5 font-display text-2xl leading-tight transition-colors group-hover:text-signal">
            {episode.title}
          </h3>

          {episode.blurb && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-dust">
              {episode.blurb}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
