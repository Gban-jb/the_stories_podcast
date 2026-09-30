<<<<<<< HEAD
# the_stories_podcast
Website of The Stories Podcast
=======
# Stories — podcast site

A full-stack site for a YouTube-hosted story podcast. Episodes are mirrored from
the channel into Postgres, then enriched here with the things YouTube has no
place for: show notes, transcripts, guests, themes and chapter navigation.

Built with Next.js (App Router), TypeScript, Tailwind CSS and Prisma.

## What's in it

| Route | What it does |
| --- | --- |
| `/` | Featured episode with player and chapter entry points, recent grid, channels, email signup |
| `/episodes` | Full archive — search across titles, notes and transcripts, filter by theme, sort, paginate |
| `/episodes/[slug]` | Player with clickable chapters, show notes, transcript, guests, share links, related episodes |
| `/about` | What the show is, who makes it, how to be on it |
| `/listen` | Every channel the show is on |
| `/admin` | Run a YouTube sync; write blurbs, notes and transcripts; set the featured episode |

API: `GET /api/episodes` (public, read-only), `POST /api/sync` (admin session or
bearer token), `POST /api/subscribe`.

## Getting it running

You need Node 20+ and a Postgres database.

### 1. Install

```bash
npm install
```

### 2. Database

Copy the example environment file:

```bash
cp .env.example .env
```

Then point `DATABASE_URL` at a Postgres database. If you don't have one, this
prints a free hosted database and its connection string:

```bash
npx create-db
```

Create the tables:

```bash
npm run db:migrate
```

### 3. See it with placeholder content

```bash
npm run db:seed
npm run dev
```

Six invented episodes so you can judge the design before connecting the
channel. Their players won't play — they aren't real videos.

### 4. Connect the YouTube channel

Two values go in `.env`:

- **`YOUTUBE_API_KEY`** — in [Google Cloud Console](https://console.cloud.google.com),
  enable **YouTube Data API v3**, create an API key, and restrict it to that API.
- **`YOUTUBE_CHANNEL_ID`** — your channel id, starting `UC`. It's on
  [youtube.com/account_advanced](https://www.youtube.com/account_advanced).

Then clear the placeholders and pull the real thing:

```bash
npm run db:reset    # drops the seeded episodes
npm run sync
```

A sync reads titles, stills, runtimes, view and like counts, tags, and any
chapter timestamps written in the description. Videos under three minutes are
treated as Shorts and skipped.

### 5. Turn on the admin

```bash
# add both to .env
ADMIN_PASSWORD="something long"
ADMIN_SESSION_SECRET="$(openssl rand -base64 32)"
```

`/admin` is unreachable until both are set. From there you can run syncs and
write the per-episode content.

## How syncing works

YouTube owns: title, description, still, runtime, publish date, view and like
counts, tags, chapter timestamps.

The site owns: blurb, show notes, transcript, status, featured flag, guests.

**A sync never overwrites the second group.** It's an upsert keyed on the
YouTube video id, so it's safe to run as often as you like.

To sync on a schedule, set `SYNC_SECRET` and call the endpoint:

```bash
curl -X POST https://your-site.com/api/sync \
  -H "Authorization: Bearer $SYNC_SECRET"
```

On Vercel, add a cron job in `vercel.json` pointing at `/api/sync`.

## Making it yours

Almost everything about the brand lives in one file: **`src/lib/site.ts`**.

- `site` — name, tagline, description, cadence
- `channels` — every social link, rendered on `/listen` and in the footer.
  Replace the `your-handle` placeholders.
- `hosts` — who appears on `/about`

The design tokens — colours, type scale, fonts — are at the top of
`src/app/globals.css` in the `@theme` block.

## Scripts

```bash
npm run dev          # dev server
npm run build        # generate the Prisma client, then build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run sync         # pull from YouTube
npm run db:migrate   # create/apply migrations
npm run db:seed      # placeholder episodes
npm run db:studio    # browse the database
npm run db:reset     # drop everything and re-migrate
```

## Deploying

Vercel is the shortest path. Set these environment variables in the project:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | yes | Your real origin, e.g. `https://stories.fm` |
| `YOUTUBE_API_KEY` | for sync | |
| `YOUTUBE_CHANNEL_ID` | for sync | |
| `ADMIN_PASSWORD` | for admin | |
| `ADMIN_SESSION_SECRET` | for admin | `openssl rand -base64 32` |
| `SYNC_SECRET` | for cron | `openssl rand -base64 32` |

Run `npm run db:deploy` against the production database once before the first
deploy.

## Notes on a few decisions

- **YouTube iframes load on click, not on page load.** The still and play button
  are ours; YouTube's player only mounts when someone asks for it. That keeps
  roughly 1.5MB of third-party script off first paint and means YouTube sets no
  cookies until the viewer has chosen to watch. Embeds use `youtube-nocookie.com`.
- **Show notes are rendered by a small Markdown subset** in `src/lib/markdown.ts`
  which escapes the input before adding any markup, rather than sanitising after.
  Links are restricted to `http`, `https`, `mailto` and site-relative paths.
- **The waveform is a signature, not a measurement.** Browser JavaScript can't
  read a YouTube video's audio, so each episode's shape is derived from its id —
  stable for that episode, different for every other. The section dividers are
  the exception: there, bar height is real episode runtime.
- **Prisma's CLI sits in devDependencies** and `mysql2`/`deepmerge-ts` are pinned
  forward in `overrides`. Both arrive through the CLI, neither is loaded at
  runtime, and pinning them keeps `npm audit` clean without downgrading Prisma.
>>>>>>> f147c7e (Add README, CI and the GitHub templates)
