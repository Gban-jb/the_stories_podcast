import type { Metadata } from "next";
import { site, hosts, channels } from "@/lib/site";
import { getShowStats, getRuntimeSeries } from "@/lib/episodes";
import { WaveformDivider } from "@/components/waveform-divider";
import { ChannelIcon } from "@/components/channel-icon";
import { spokenDuration, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "About",
  description: `How ${site.name} gets made, and who makes it.`,
};

export const revalidate = 3600;

export default async function AboutPage() {
  const [stats, runtimes] = await Promise.all([
    getShowStats().catch(() => null),
    getRuntimeSeries().catch(() => []),
  ]);

  return (
    <div className="pt-14 md:pt-20">
      <header className="shell">
        <p className="label text-dust-deep">About</p>
        <h1 className="mt-4 max-w-3xl text-title font-display">
          {site.tagline}
        </h1>
        <WaveformDivider runtimes={runtimes} className="mt-10" />
      </header>

      <section className="shell mt-16 grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
        <div>
          <h2 className="label text-dust-deep">What it is</h2>
        </div>
        <div className="space-y-5 text-lede text-bone-dim">
          <p>{site.description}</p>
          <p className="text-base text-dust">
            Each episode is one person telling one story from start to finish. We
            record long and cut little, because the parts people usually edit out
            — the pause before a hard sentence, the correction, the second
            attempt at a memory — are usually the parts that matter.
          </p>
          <p className="text-base text-dust">
            Chapters mark the turns in a story, so an hour-long episode is
            something you can leave and come back to.
          </p>
        </div>
      </section>

      {stats && stats.episodeCount > 0 && (
        <section className="shell mt-24">
          <dl className="grid gap-px border border-ink-edge bg-ink-edge sm:grid-cols-3">
            {[
              { label: "Episodes", value: String(stats.episodeCount) },
              { label: "Total runtime", value: spokenDuration(stats.totalSeconds) },
              {
                label: "Most recent",
                value: stats.latestPublishedAt
                  ? formatDate(stats.latestPublishedAt)
                  : "—",
              },
            ].map((item) => (
              <div key={item.label} className="bg-ink p-7">
                <dt className="label text-dust-deep">{item.label}</dt>
                <dd className="mt-3 font-display text-3xl text-signal">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="shell mt-24 grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
        <div>
          <h2 className="label text-dust-deep">Who makes it</h2>
        </div>
        <ul className="space-y-10">
          {hosts.map((host) => (
            <li key={host.name}>
              <p className="font-display text-3xl">{host.name}</p>
              <p className="label mt-2 text-signal-deep">{host.role}</p>
              <p className="mt-4 max-w-prose leading-relaxed text-dust">{host.bio}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell mt-24 grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-20">
        <div>
          <h2 className="label text-dust-deep">Be on it</h2>
        </div>
        <div>
          <p className="max-w-prose text-lede text-bone-dim">
            If you have a story you&apos;ve been carrying and you&apos;d like to
            tell it once, properly, get in touch on any of these.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {channels.map((c) => (
              <li key={c.id}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="label inline-flex items-center gap-2 border border-ink-edge-strong px-4 py-3 text-dust transition-colors hover:border-signal hover:text-signal"
                >
                  <ChannelIcon icon={c.icon} className="size-4" />
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
