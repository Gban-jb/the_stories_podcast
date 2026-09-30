"use client";

import { useState } from "react";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done" }
  | { status: "error"; message: string };

/**
 * Email capture. Writes to the Subscriber table — wire it to a mail provider
 * when there's actually something to send.
 */
export function SubscribeForm({ source = "site" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setState({ status: "sending" });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setState({
          status: "error",
          message: body?.error ?? "That didn't go through. Try again in a moment.",
        });
        return;
      }
      setState({ status: "done" });
      setEmail("");
    } catch {
      setState({
        status: "error",
        message: "No connection. Check your network and try again.",
      });
    }
  }

  if (state.status === "done") {
    return (
      <p className="text-lede text-signal">
        You&apos;re on the list. The next episode lands in your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md">
      <label htmlFor="subscribe-email" className="label text-dust-deep">
        Email
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="subscribe-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.status === "error") setState({ status: "idle" });
          }}
          placeholder="you@example.com"
          aria-describedby={state.status === "error" ? "subscribe-error" : undefined}
          aria-invalid={state.status === "error"}
          className="min-w-0 flex-1 border border-ink-edge-strong bg-ink-raised px-4 py-3.5 text-sm text-bone placeholder:text-dust-deep focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="label shrink-0 bg-signal px-6 py-3.5 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state.status === "sending" ? "Adding…" : "Notify me"}
        </button>
      </div>

      {state.status === "error" && (
        <p id="subscribe-error" role="alert" className="mt-3 text-sm text-peak">
          {state.message}
        </p>
      )}
      <p className="mt-3 text-xs text-dust-deep">
        One email per episode. Nothing else, and you can leave any time.
      </p>
    </form>
  );
}
