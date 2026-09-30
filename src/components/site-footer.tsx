import Link from "next/link";
import { site, channels } from "@/lib/site";
import { ChannelIcon } from "./channel-icon";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-ink-edge">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div>
          <p className="font-display text-3xl leading-none">{site.name}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-dust">
            {site.tagline} New episodes {site.cadence}.
          </p>
        </div>

        <nav aria-label="Pages">
          <p className="label text-dust-deep">Pages</p>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { href: "/episodes", label: "All episodes" },
              { href: "/about", label: "About the show" },
              { href: "/listen", label: "Where to listen" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-bone-dim transition-colors hover:text-signal">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Channels">
          <p className="label text-dust-deep">Follow</p>
          <ul className="mt-5 space-y-3 text-sm">
            {channels.map((c) => (
              <li key={c.id}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 text-bone-dim transition-colors hover:text-signal"
                >
                  <ChannelIcon icon={c.icon} className="size-4" />
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="shell flex flex-col gap-3 border-t border-ink-edge py-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="label text-dust-deep">
          © {new Date().getFullYear()} {site.name}
        </p>
        <p className="label text-dust-deep">Recorded and released on YouTube</p>
      </div>
    </footer>
  );
}
