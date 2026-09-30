import Link from "next/link";
import { Waveform } from "@/components/waveform";

export default function NotFound() {
  return (
    <div className="shell py-28 md:py-40">
      <p className="label text-peak">Dead air</p>
      <h1 className="mt-5 max-w-2xl text-title font-display">
        There&apos;s no episode at this address.
      </h1>
      <p className="mt-5 max-w-md text-dust">
        The link may be old, or the episode may have been renamed. The archive is
        searchable — the story you want is probably still in it.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/episodes"
          className="label bg-signal px-5 py-3.5 text-ink transition-opacity hover:opacity-90"
        >
          Search the archive
        </Link>
        <Link
          href="/"
          className="label border border-ink-edge-strong px-5 py-3.5 text-bone transition-colors hover:border-signal hover:text-signal"
        >
          Back to the latest
        </Link>
      </div>

      {/* Flat line: the one place the waveform reads as silence. */}
      <Waveform
        bars={Array.from({ length: 128 }, () => 0.04)}
        heightClassName="h-16 opacity-50"
        className="mt-20"
      />
    </div>
  );
}
