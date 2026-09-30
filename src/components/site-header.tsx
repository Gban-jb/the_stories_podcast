"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site, primaryChannel } from "@/lib/site";

const nav = [
  { href: "/episodes", label: "Episodes" },
  { href: "/about", label: "About" },
  { href: "/listen", label: "Listen" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  /**
   * The menu remembers which route it was opened on rather than holding a
   * boolean. Navigating anywhere — including via back/forward — changes the
   * pathname, so the menu closes itself with no effect to synchronise.
   */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-500 ${
        scrolled || open
          ? "border-b border-ink-edge bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-20 items-center justify-between gap-6">
        <Link
          href="/"
          className="group flex items-baseline gap-2.5"
          aria-label={`${site.name} home`}
        >
          <span className="font-display text-2xl leading-none tracking-tight">
            {site.name}
          </span>
          {/* The recording lamp: the show is on air, and the dot says so. */}
          <span
            className="lamp-pulse mb-0.5 size-1.5 rounded-full bg-peak"
            aria-hidden="true"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`label transition-colors ${
                  active ? "text-signal" : "text-dust hover:text-bone"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={primaryChannel.href}
            target="_blank"
            rel="noreferrer"
            className="label border border-ink-edge-strong px-4 py-2.5 text-bone transition-colors hover:border-signal hover:bg-signal hover:text-ink"
          >
            Subscribe
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="label -mr-2 px-2 py-3 text-dust md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="shell border-t border-ink-edge pb-8 md:hidden"
          aria-label="Main"
        >
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block border-b border-ink-edge py-5 font-display text-3xl"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={primaryChannel.href}
            target="_blank"
            rel="noreferrer"
            className="label mt-6 block bg-signal px-5 py-4 text-center text-ink"
          >
            Subscribe on {primaryChannel.label}
          </a>
        </nav>
      )}
    </header>
  );
}
