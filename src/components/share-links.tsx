"use client";

import { useState } from "react";

/**
 * Share targets that don't need an SDK: each is a plain URL. Copy is offered
 * first because it's what people actually use to paste into a DM.
 */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { label: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some contexts; the share links still work.
      setCopied(false);
    }
  }

  return (
    <div>
      <p className="label text-dust-deep">Pass it on</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="label border border-ink-edge-strong px-3.5 py-2.5 text-bone transition-colors hover:border-signal hover:text-signal"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        {targets.map((t) => (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noreferrer"
            className="label border border-ink-edge-strong px-3.5 py-2.5 text-dust transition-colors hover:border-signal hover:text-signal"
          >
            {t.label}
          </a>
        ))}
      </div>
    </div>
  );
}
