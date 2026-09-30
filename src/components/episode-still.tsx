import Image from "next/image";
import { waveformBars } from "@/lib/waveform";

/**
 * An episode's still. YouTube doesn't generate a maxres thumbnail for every
 * upload, and seeded preview data has none at all, so the fallback draws the
 * episode's own waveform rather than showing a broken image.
 */
export function EpisodeStill({
  src,
  seed,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null | undefined;
  seed: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={className}
      />
    );
  }

  const bars = waveformBars(seed, 48);

  return (
    <div
      className="absolute inset-0 flex items-center gap-[2px] bg-ink-sunk px-5"
      aria-hidden="true"
    >
      {bars.map((value, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[1px] bg-ink-edge-strong"
          style={{ height: `${Math.max(3, value * 55)}%` }}
        />
      ))}
    </div>
  );
}
