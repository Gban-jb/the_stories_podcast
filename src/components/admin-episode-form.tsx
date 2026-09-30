"use client";

import { useActionState } from "react";
import { saveEpisodeAction, type ActionResult } from "@/app/admin/actions";

type Episode = {
  id: string;
  title: string;
  blurb: string | null;
  showNotes: string | null;
  transcript: string | null;
  status: string;
  featured: boolean;
};

/**
 * The fields YouTube doesn't have: a hook for cards, notes written for readers,
 * and the transcript. Everything YouTube owns is read-only here and refreshed
 * by the next sync.
 */
export function AdminEpisodeForm({ episode }: { episode: Episode }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    saveEpisodeAction,
    null,
  );

  const field =
    "mt-2 w-full border border-ink-edge-strong bg-ink px-3.5 py-3 text-sm text-bone focus:border-signal focus:outline-none";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={episode.id} />

      <div>
        <label htmlFor={`blurb-${episode.id}`} className="label text-dust-deep">
          Blurb — one or two lines, shown on cards
        </label>
        <textarea
          id={`blurb-${episode.id}`}
          name="blurb"
          rows={2}
          maxLength={400}
          defaultValue={episode.blurb ?? ""}
          className={field}
        />
      </div>

      <div>
        <label htmlFor={`notes-${episode.id}`} className="label text-dust-deep">
          Show notes — Markdown: ## headings, - bullets, **bold**, [links](https://…)
        </label>
        <textarea
          id={`notes-${episode.id}`}
          name="showNotes"
          rows={8}
          defaultValue={episode.showNotes ?? ""}
          className={`${field} font-mono text-xs leading-relaxed`}
        />
      </div>

      <div>
        <label htmlFor={`transcript-${episode.id}`} className="label text-dust-deep">
          Transcript — plain text, blank line between paragraphs
        </label>
        <textarea
          id={`transcript-${episode.id}`}
          name="transcript"
          rows={6}
          defaultValue={episode.transcript ?? ""}
          className={`${field} font-mono text-xs leading-relaxed`}
        />
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor={`status-${episode.id}`} className="label text-dust-deep">
            Status
          </label>
          <select
            id={`status-${episode.id}`}
            name="status"
            defaultValue={episode.status}
            className={field}
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 pb-3">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={episode.featured}
            className="size-4 accent-[var(--color-signal)]"
          />
          <span className="label text-dust">Feature on the home page</span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="label ml-auto border border-signal px-5 py-3 text-signal transition-colors hover:bg-signal hover:text-ink disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {state && (
        <p role="status" className={`text-sm ${state.ok ? "text-signal" : "text-peak"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
