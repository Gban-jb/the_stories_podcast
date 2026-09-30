import { z } from "zod";

/**
 * Fail at boot with a readable message rather than at the first query with a
 * confusing one. Client-safe values live in src/lib/site.ts, not here.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is not set. See README → Database."),
  /** YouTube Data API v3 key. Sync is disabled without it; the rest of the site works. */
  YOUTUBE_API_KEY: z.string().optional(),
  /** The channel to mirror, e.g. UCxxxxxxxxxxxxxxxxxxxxxx. */
  YOUTUBE_CHANNEL_ID: z.string().optional(),
  /** Password for /admin. Admin is unreachable until this is set. */
  ADMIN_PASSWORD: z.string().min(8).optional(),
  /** Signs the admin session cookie. Generate with: openssl rand -base64 32 */
  ADMIN_SESSION_SECRET: z.string().min(16).optional(),
  /** Lets cron or a CI job POST /api/sync without a browser session. */
  SYNC_SECRET: z.string().min(16).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment:\n${issues}`);
}

export const env = parsed.data;

export const youtubeConfigured = Boolean(
  env.YOUTUBE_API_KEY && env.YOUTUBE_CHANNEL_ID,
);

export const adminConfigured = Boolean(
  env.ADMIN_PASSWORD && env.ADMIN_SESSION_SECRET,
);
