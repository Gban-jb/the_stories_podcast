import { waveformBars } from "@/lib/waveform";

type WaveformProps = {
  /** Anything stable — an episode id. The same seed always draws the same shape. */
  seed?: string;
  /** Or supply bars directly, e.g. runtimes for the section dividers. */
  bars?: number[];
  count?: number;
  /** 0–1. Bars before this point take the signal colour. */
  progress?: number;
  /** Chapter positions as 0–1 fractions, drawn as ticks under the bars. */
  marks?: number[];
  className?: string;
  /** Draw the bars in on first paint, left to right. */
  animate?: boolean;
  /** Tailwind height class on the bar row. */
  heightClassName?: string;
};

/**
 * The show is recorded voice, so its recurring mark is the shape of a voice.
 * This renders in three places: as the hero's baseline, as the section rule
 * between blocks (where bar height is real episode runtime), and as the
 * progress track on the player.
 */
export function Waveform({
  seed,
  bars,
  count = 96,
  progress,
  marks = [],
  className = "",
  animate = false,
  heightClassName = "h-16",
}: WaveformProps) {
  const values = bars ?? waveformBars(seed ?? "stories", count);
  const played = progress == null ? -1 : Math.round(progress * values.length);

  return (
    <div className={className} aria-hidden="true">
      <div className={`flex w-full items-end gap-px ${heightClassName}`}>
        {values.map((value, i) => {
          const isPlayed = i < played;
          return (
            <span
              key={i}
              className={`flex-1 origin-bottom rounded-t-[1px] transition-colors duration-500 ${
                isPlayed ? "bg-signal" : "bg-ink-edge-strong"
              }`}
              style={{
                height: `${Math.max(2, value * 100)}%`,
                ...(animate
                  ? {
                      animation: `draw-bar 0.5s var(--ease-out-soft) both`,
                      // Sweep left to right rather than all at once.
                      animationDelay: `${0.25 + i * 0.006}s`,
                    }
                  : null),
              }}
            />
          );
        })}
      </div>

      {marks.length > 0 && (
        <div className="relative mt-1 h-2">
          {marks.map((at, i) => (
            <span
              key={i}
              className="absolute top-0 h-2 w-px bg-cassette/60"
              style={{ left: `${Math.min(100, Math.max(0, at * 100))}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
