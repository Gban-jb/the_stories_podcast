"use client";

import { useActionState } from "react";
import { signInAction, type ActionResult } from "../actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );

  return (
    <div className="shell flex min-h-[70dvh] items-center py-20">
      <div className="w-full max-w-sm">
        <p className="label text-dust-deep">Admin</p>
        <h1 className="mt-4 font-display text-4xl">Sign in</h1>
        <p className="mt-3 text-sm text-dust">
          The shared password from <code className="timecode text-cassette">ADMIN_PASSWORD</code>.
        </p>

        <form action={action} className="mt-8">
          <label htmlFor="password" className="label text-dust-deep">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
            aria-invalid={state?.ok === false}
            aria-describedby={state?.ok === false ? "signin-error" : undefined}
            className="mt-3 w-full border border-ink-edge-strong bg-ink-raised px-4 py-3.5 text-sm text-bone focus:border-signal focus:outline-none"
          />

          {state?.ok === false && (
            <p id="signin-error" role="alert" className="mt-3 text-sm text-peak">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="label mt-6 w-full bg-signal px-5 py-3.5 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
