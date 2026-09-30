import { cookies } from "next/headers";
import { env, adminConfigured } from "./env";

const COOKIE = "stories_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

/**
 * A single shared password behind an HMAC-signed cookie. That's the right size
 * for a one-or-two-person show; swap in a real identity provider if the team
 * ever grows past sharing one secret.
 */

function encoder() {
  return new TextEncoder();
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder().encode(env.ADMIN_SESSION_SECRET ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function sign(payload: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await key(), encoder().encode(payload));
  return `${payload}.${toBase64Url(mac)}`;
}

async function verify(token: string): Promise<boolean> {
  const at = token.lastIndexOf(".");
  if (at <= 0) return false;
  const payload = token.slice(0, at);
  const provided = token.slice(at + 1);

  const expected = await crypto.subtle.sign(
    "HMAC",
    await key(),
    encoder().encode(payload),
  );
  // Compare the MACs, not the strings, and do it in constant time.
  const a = Buffer.from(provided, "base64url");
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return false;

  const expiresAt = Number(payload.split(":")[1]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** Constant-time password check so a wrong guess doesn't leak its prefix. */
function passwordMatches(input: string): boolean {
  const expected = env.ADMIN_PASSWORD ?? "";
  const a = encoder().encode(input);
  const b = encoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signIn(password: string): Promise<boolean> {
  if (!adminConfigured) return false;
  if (!passwordMatches(password)) return false;

  const token = await sign(`admin:${Date.now() + MAX_AGE_SECONDS * 1000}`);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isSignedIn(): Promise<boolean> {
  if (!adminConfigured) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  return verify(token);
}

/** For POST /api/sync from cron: a bearer token instead of a browser session. */
export function hasSyncSecret(header: string | null): boolean {
  if (!env.SYNC_SECRET || !header) return false;
  const provided = header.replace(/^Bearer\s+/i, "");
  const a = encoder().encode(provided);
  const b = encoder().encode(env.SYNC_SECRET);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
