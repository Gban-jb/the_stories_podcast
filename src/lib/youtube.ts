import { z } from "zod";
import { env } from "./env";
import { parseIsoDuration, slugify } from "./format";

const API = "https://www.googleapis.com/youtube/v3";

/**
 * The channel's uploads are a playlist whose id is the channel id with the
 * second character changed from C to U. Documented, stable, and saves a
 * channels.list call per sync.
 */
function uploadsPlaylistId(channelId: string): string {
  return `UU${channelId.slice(2)}`;
}

const thumbnailSchema = z
  .object({
    maxres: z.object({ url: z.string() }).optional(),
    standard: z.object({ url: z.string() }).optional(),
    high: z.object({ url: z.string() }).optional(),
    medium: z.object({ url: z.string() }).optional(),
    default: z.object({ url: z.string() }).optional(),
  })
  .optional();

const playlistPageSchema = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(
    z.object({
      contentDetails: z.object({
        videoId: z.string(),
        videoPublishedAt: z.string().optional(),
      }),
    }),
  ),
});

const videoPageSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        title: z.string(),
        description: z.string(),
        publishedAt: z.string(),
        thumbnails: thumbnailSchema,
        tags: z.array(z.string()).optional(),
      }),
      contentDetails: z.object({ duration: z.string() }),
      statistics: z
        .object({
          viewCount: z.string().optional(),
          likeCount: z.string().optional(),
        })
        .optional(),
      /** Absent for public videos; present and non-empty means don't show it. */
      status: z.object({ privacyStatus: z.string() }).optional(),
    }),
  ),
});

export type YouTubeVideo = {
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: Date;
  durationSeconds: number;
  thumbnailUrl: string | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  isPublic: boolean;
  /** Parsed out of the description when the channel writes "Chapters:". */
  chapters: { startSeconds: number; title: string }[];
  /** Parsed from a title like "042 — The night the river came back". */
  number: number | null;
  slug: string;
};

class YouTubeError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "YouTubeError";
  }
}

async function call<T>(
  path: string,
  params: Record<string, string>,
  schema: z.ZodType<T>,
): Promise<T> {
  if (!env.YOUTUBE_API_KEY) {
    throw new YouTubeError("YOUTUBE_API_KEY is not set.");
  }
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // Quota exhaustion is the common failure and deserves to say so plainly.
    const hint =
      res.status === 403 && body.includes("quotaExceeded")
        ? " YouTube's daily quota is used up; the next sync will work after it resets at midnight Pacific."
        : "";
    throw new YouTubeError(
      `YouTube ${path} failed with ${res.status}.${hint}`,
      res.status,
    );
  }
  return schema.parse(await res.json());
}

/** Best available still. maxres doesn't exist for every upload. */
function pickThumbnail(t: z.infer<typeof thumbnailSchema>): string | null {
  if (!t) return null;
  return (
    t.maxres?.url ?? t.standard?.url ?? t.high?.url ?? t.medium?.url ?? t.default?.url ?? null
  );
}

/**
 * Pull "12:04 The flood" / "1:02:22 — Afterward" lines out of a YouTube
 * description. Channels write these by hand, so be forgiving about the dash.
 */
export function parseChapters(description: string): { startSeconds: number; title: string }[] {
  const out: { startSeconds: number; title: string }[] = [];
  const seen = new Set<number>();

  for (const line of description.split("\n")) {
    const m = /^\s*(?:\(|\[)?(\d{1,2}:)?(\d{1,2}):(\d{2})(?:\)|\])?\s*[-–—:|]?\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const [, h, mm, ss, title] = m;
    if (!title || title.length < 2) continue;

    const startSeconds =
      Number((h ?? "0:").replace(":", "")) * 3600 + Number(mm) * 60 + Number(ss);
    if (seen.has(startSeconds)) continue;
    seen.add(startSeconds);
    out.push({ startSeconds, title: title.replace(/^[-–—:\s]+/, "").slice(0, 160) });
  }

  // A stray timestamp in prose isn't a chapter list; require a real sequence.
  if (out.length < 2) return [];
  return out.sort((a, b) => a.startSeconds - b.startSeconds);
}

/** "042 — The night..." / "Ep. 42: The night..." → 42 */
export function parseEpisodeNumber(title: string): number | null {
  const m =
    /^\s*(?:ep(?:isode)?\.?\s*)?#?(\d{1,4})\s*[-–—:.|]/i.exec(title) ??
    /^\s*(?:ep(?:isode)?\.?\s*)#?(\d{1,4})\b/i.exec(title);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n < 10000 ? n : null;
}

/** Drop the leading "042 — " so the site's title isn't redundant with EP 042. */
export function cleanTitle(title: string): string {
  return title
    .replace(/^\s*(?:ep(?:isode)?\.?\s*)?#?\d{1,4}\s*[-–—:.|]\s*/i, "")
    .trim() || title.trim();
}

/** Every video on the channel, newest first. Paginates until YouTube stops. */
export async function fetchChannelVideos(
  options: { max?: number } = {},
): Promise<YouTubeVideo[]> {
  const channelId = env.YOUTUBE_CHANNEL_ID;
  if (!channelId) throw new YouTubeError("YOUTUBE_CHANNEL_ID is not set.");

  const max = options.max ?? 500;
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const page = await call(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId: uploadsPlaylistId(channelId),
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
      playlistPageSchema,
    );
    for (const item of page.items) ids.push(item.contentDetails.videoId);
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < max);

  const videos: YouTubeVideo[] = [];

  // videos.list takes 50 ids per call, which is where duration and stats live.
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const page = await call(
      "videos",
      {
        part: "snippet,contentDetails,statistics,status",
        id: batch.join(","),
      },
      videoPageSchema,
    );

    for (const v of page.items) {
      const title = v.snippet.title;
      const number = parseEpisodeNumber(title);
      const clean = cleanTitle(title);
      videos.push({
        youtubeId: v.id,
        title: clean,
        description: v.snippet.description,
        publishedAt: new Date(v.snippet.publishedAt),
        durationSeconds: parseIsoDuration(v.contentDetails.duration),
        thumbnailUrl: pickThumbnail(v.snippet.thumbnails),
        tags: (v.snippet.tags ?? []).slice(0, 12),
        viewCount: Number(v.statistics?.viewCount ?? 0),
        likeCount: Number(v.statistics?.likeCount ?? 0),
        isPublic: (v.status?.privacyStatus ?? "public") === "public",
        chapters: parseChapters(v.snippet.description),
        number,
        slug: slugify(clean) || v.id.toLowerCase(),
      });
    }
  }

  return videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export { YouTubeError };
