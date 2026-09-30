import { barsFromDurations } from "@/lib/waveform";
import { Waveform } from "./waveform";

/**
 * The rule between sections isn't decoration: one bar per episode, height
 * proportional to that episode's runtime, newest on the left. The line under a
 * heading shows the shape of the archive it introduces.
 */
export function WaveformDivider({
  runtimes,
  className = "",
}: {
  runtimes: number[];
  className?: string;
}) {
  return (
    <Waveform
      bars={barsFromDurations(runtimes, 128)}
      heightClassName="h-6 opacity-40"
      className={className}
    />
  );
}
