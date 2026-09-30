/**
 * The site's recurring mark is a waveform: the literal artifact of a recorded
 * voice. We can't read the audio of a YouTube video from the browser, so the
 * shape is derived from the episode's own id — stable forever for a given
 * episode, different for every episode, and honest about being a signature
 * rather than a measurement.
 */

/** FNV-1a, enough for a seed and cheap on the server. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good enough spread for visual noise. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Amplitudes in [0.08, 1]. Speech isn't white noise — it comes in phrases, so
 * a slow envelope rides under the per-bar jitter and the result reads as talk
 * rather than static.
 */
export function waveformBars(seed: string, count = 96): number[] {
  const random = rng(hash(seed));
  const bars: number[] = [];

  // Three slow sines at incommensurate periods give a non-repeating envelope.
  const phase = [random() * Math.PI * 2, random() * Math.PI * 2, random() * Math.PI * 2];

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const envelope =
      0.55 +
      0.22 * Math.sin(t * Math.PI * 6.3 + phase[0]) +
      0.14 * Math.sin(t * Math.PI * 11.7 + phase[1]) +
      0.09 * Math.sin(t * Math.PI * 19.1 + phase[2]);

    // Breath between phrases: a few bars drop near silence.
    const gap = random() < 0.06 ? 0.25 : 1;
    const jitter = 0.72 + random() * 0.56;

    const value = envelope * jitter * gap;
    bars.push(Math.min(1, Math.max(0.08, value)));
  }

  // Taper the ends so the shape sits inside its box instead of being clipped.
  const taper = Math.max(2, Math.floor(count * 0.03));
  for (let i = 0; i < taper; i++) {
    const k = (i + 1) / (taper + 1);
    bars[i] *= k;
    bars[count - 1 - i] *= k;
  }

  return bars;
}

/**
 * The divider between sections is a waveform too, but its bars carry real data:
 * one bar per episode, height proportional to that episode's runtime. The rule
 * under a section literally shows the shape of the archive it introduces.
 */
export function barsFromDurations(durations: number[], count = 96): number[] {
  if (durations.length === 0) return waveformBars("empty", count);
  const max = Math.max(...durations, 1);

  // Resample to `count` bars so the divider is the same width regardless of
  // how many episodes exist.
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const at = (i / count) * durations.length;
    const lo = Math.floor(at);
    const hi = Math.min(durations.length - 1, lo + 1);
    const mix = at - lo;
    const value = durations[lo] * (1 - mix) + durations[hi] * mix;
    bars.push(Math.min(1, Math.max(0.1, value / max)));
  }
  return bars;
}
