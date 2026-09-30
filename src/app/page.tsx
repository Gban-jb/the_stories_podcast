import Link from "next/link";
import { site, channels } from "@/lib/site";
import {
  getFeaturedEpisodeWithChapters,
  getLatestEpisodes,
  getRuntimeSeries,
  getShowStats,
} from "@/lib/episodes";
import { FeaturedHero } from "@/components/featured-hero";
import { EpisodeCard } from "@/components/episode-card";
import { WaveformDivider } from "@/components/waveform-divider";
import { SubscribeForm } from "@/components/subscribe-form";
import { ChannelIcon } from "@/components/channel-icon";
import { NoEpisodes } from "@/components/empty-state";
import { spokenDuration } from "@/lib/format";

/** Episodes change when a sync runs, not per request. */
export const revalidate = 600;

export default async function HomePage() {
  const [featured, latest, runtimes, stats] = await Promise.all([
    getFeaturedEpisodeWithChapters(),
    getLatestEpisodes(7),
    getRuntimeSeries(),
    getShowStats(),
  ]);

  if (!featured) return <NoEpisodes />;

  // The hero already carries the featured episode; don't repeat it in the grid.
  const rest = latest.filter((e) => e.id !== featured.id).slice(0, 6);

  return (
    <>
      <FeaturedHero episode={featured} />

      {/* --- The archive --- */}
      <section className="pt-24 md:pt-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-dust-deep">The archive</p>
              <h2 className="mt-4 max-w-xl text-title font-display">
                {stats.episodeCount} stories,{" "}
                <span className="text-signal">
                  {spokenDuration(stats.totalSeconds)}
                </span>{" "}
                of listening.
              </h2>
            </div>
            <Link
              href="/episodes"
              className="label inline-flex items-center gap-2 border-b border-ink-edge-strong pb-1.5 text-bone transition-colors hover:border-signal hover:text-signal"
            >
              All episodes
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* One bar per episode, height = its runtime. The rule is the data. */}
          <WaveformDivider runtimes={runtimes} className="mt-10" />
        </div>

        <div className="shell mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((episode, i) => (
            <EpisodeCard key={episode.id} episode={episode} priority={i < 3} />
          ))}
        </div>
      </section>

      {/* --- What the show is --- */}
      <section className="pt-28 md:pt-36">
        <div className="shell grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
          <div>
            <p className="label text-dust-deep">The premise</p>
            <h2 className="mt-4 text-title font-display">
              One person. One story. No interruptions.
            </h2>
          </div>
          <div className="space-y-5 text-lede text-bone-dim">
            <p>{site.description}</p>
            <p className="text-base text-dust">
              Every episode is a single conversation, cut as little as we can
              manage. Chapters mark where the story turns, so you can leave and
              come back without losing your place.
            </p>
            <Link
              href="/about"
              className="label inline-flex items-center gap-2 border-b border-signal/40 pb-1.5 text-signal transition-colors hover:border-signal"
            >
              How it gets made
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- Where to find it --- */}
      <section className="pt-28 md:pt-36">
        <div className="shell">
          <p className="label text-dust-deep">Follow along</p>
          <h2 className="mt-4 max-w-2xl text-title font-display">
            The episodes live on YouTube. Everything around them is elsewhere.
          </h2>

          <ul className="mt-12 grid gap-px border border-ink-edge bg-ink-edge sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <li key={channel.id}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col justify-between gap-8 bg-ink p-7 transition-colors hover:bg-ink-raised"
                >
                  <span className="flex items-start justify-between gap-4">
                    <ChannelIcon
                      icon={channel.icon}
                      className="size-6 text-dust transition-colors group-hover:text-signal"
                    />
                    {channel.primary && (
                      <span className="label text-signal">Main</span>
                    )}
                  </span>
                  <span>
                    <span className="block font-display text-2xl transition-colors group-hover:text-signal">
                      {channel.label}
                    </span>
                    <span className="mt-1.5 block text-sm text-dust">
                      {channel.note}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Email --- */}
      <section className="pt-28 md:pt-36">
        <div className="shell grid gap-10 md:grid-cols-[1fr_1fr] md:gap-20">
          <div>
            <p className="label text-dust-deep">By email</p>
            <h2 className="mt-4 text-title font-display">
              A note when a new one lands.
            </h2>
            <p className="mt-5 text-dust">
              New episodes {site.cadence}. One short email each time, with the
              story behind the story.
            </p>
          </div>
          <div className="md:pt-14">
            <SubscribeForm source="home" />
          </div>
        </div>
      </section>
    </>
  );
}
