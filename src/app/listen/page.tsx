import type { Metadata } from "next";
import { site, channels, primaryChannel } from "@/lib/site";
import { ChannelIcon } from "@/components/channel-icon";
import { SubscribeForm } from "@/components/subscribe-form";
import { getRuntimeSeries } from "@/lib/episodes";
import { WaveformDivider } from "@/components/waveform-divider";

export const metadata: Metadata = {
  title: "Listen",
  description: `Every place you can follow ${site.name}.`,
};

export const revalidate = 3600;

export default async function ListenPage() {
  const runtimes = await getRuntimeSeries().catch(() => []);

  return (
    <div className="pt-14 md:pt-20">
      <header className="shell">
        <p className="label text-dust-deep">Where to listen</p>
        <h1 className="mt-4 max-w-3xl text-title font-display">
          Episodes go up on {primaryChannel.label}. Everything else is around them.
        </h1>
        <WaveformDivider runtimes={runtimes} className="mt-10" />
      </header>

      <section className="shell mt-14">
        <ul className="grid gap-px border border-ink-edge bg-ink-edge sm:grid-cols-2">
          {channels.map((channel) => (
            <li key={channel.id} className={channel.primary ? "sm:col-span-2" : undefined}>
              <a
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full items-start justify-between gap-6 bg-ink p-7 transition-colors hover:bg-ink-raised md:p-9"
              >
                <span className="flex items-start gap-5">
                  <ChannelIcon
                    icon={channel.icon}
                    className={`mt-1 shrink-0 transition-colors group-hover:text-signal ${
                      channel.primary ? "size-8 text-signal" : "size-6 text-dust"
                    }`}
                  />
                  <span>
                    <span
                      className={`block font-display transition-colors group-hover:text-signal ${
                        channel.primary ? "text-4xl" : "text-2xl"
                      }`}
                    >
                      {channel.label}
                    </span>
                    <span className="mt-2 block max-w-sm text-sm text-dust">
                      {channel.note}
                    </span>
                  </span>
                </span>
                <span
                  className="label shrink-0 text-dust-deep transition-colors group-hover:text-signal"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="shell mt-24 grid gap-10 md:grid-cols-2 md:gap-20">
        <div>
          <h2 className="label text-dust-deep">Or by email</h2>
          <p className="mt-4 text-lede text-bone-dim">
            One note each time an episode goes up. New ones land {site.cadence}.
          </p>
        </div>
        <div>
          <SubscribeForm source="listen" />
        </div>
      </section>
    </div>
  );
}
