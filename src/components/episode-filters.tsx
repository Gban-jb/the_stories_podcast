"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Tag = { name: string; slug: string; _count: { episodes: number } };

const sorts = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "longest", label: "Longest" },
];

/**
 * Search, tag and sort all live in the URL, so a filtered archive is a link
 * someone can send. Typing is debounced and the request runs in a transition,
 * which keeps the previous results on screen instead of flashing a loader.
 */
export function EpisodeFilters({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeQuery = params.get("q") ?? "";
  const activeTag = params.get("tag");
  const activeSort = params.get("sort") ?? "newest";

  const [value, setValue] = useState(activeQuery);
  const firstRender = useRef(true);

  function apply(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, v] of Object.entries(next)) {
      if (v == null || v === "") search.delete(key);
      else search.set(key, v);
    }
    // Any filter change starts the results over from page one.
    search.delete("page");
    startTransition(() => {
      router.push(`/episodes${search.size ? `?${search}` : ""}`, { scroll: false });
    });
  }

  // Debounce the text field only; the chips and select apply immediately.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (value === activeQuery) return;
    const timer = setTimeout(() => apply({ q: value }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={pending ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="episode-search" className="sr-only">
            Search episodes
          </label>
          <input
            id="episode-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search titles, notes and transcripts"
            className="w-full border border-ink-edge-strong bg-ink-raised px-4 py-3.5 text-sm text-bone placeholder:text-dust-deep focus:border-signal focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="episode-sort" className="label text-dust-deep">
            Sort
          </label>
          <select
            id="episode-sort"
            value={activeSort}
            onChange={(e) => apply({ sort: e.target.value })}
            className="border border-ink-edge-strong bg-ink-raised px-3 py-3.5 text-sm text-bone focus:border-signal focus:outline-none"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value} className="bg-ink-raised">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => apply({ tag: null })}
            aria-pressed={!activeTag}
            className={`label border px-3 py-2 transition-colors ${
              !activeTag
                ? "border-signal bg-signal text-ink"
                : "border-ink-edge-strong text-dust hover:border-signal hover:text-signal"
            }`}
          >
            All
          </button>
          {tags.map((tag) => {
            const active = activeTag === tag.slug;
            return (
              <button
                key={tag.slug}
                type="button"
                onClick={() => apply({ tag: active ? null : tag.slug })}
                aria-pressed={active}
                className={`label border px-3 py-2 transition-colors ${
                  active
                    ? "border-signal bg-signal text-ink"
                    : "border-ink-edge-strong text-dust hover:border-signal hover:text-signal"
                }`}
              >
                {tag.name}
                <span className="ml-1.5 opacity-60">{tag._count.episodes}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
