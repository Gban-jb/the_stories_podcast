"use client";

import { useState, useTransition } from "react";
import { runSyncAction, type ActionResult } from "@/app/admin/actions";

export function AdminSyncButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() =>
          startTransition(async () => {
            setResult(null);
            setResult(await runSyncAction());
          })
        }
        className="label bg-signal px-5 py-3.5 text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {pending ? "Syncing from YouTube…" : "Sync from YouTube"}
      </button>

      {result && (
        <p
          role="status"
          className={`mt-4 text-sm ${result.ok ? "text-signal" : "text-peak"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
