import { db } from "./db";
import { fetchChannelVideos, type YouTubeVideo } from "./youtube";
import { slugify } from "./format";

/**
 * Videos shorter than this are Shorts and promo clips, not episodes. They still
 * live on the channel; they just don't get a page here.
 */
const MIN_EPISODE_SECONDS = 180;

export type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
  total: number;
  runId: string;
};

/**
 * Make sure the slug we're about to write isn't already taken by a *different*
 * episode. Two videos can share a cleaned title ("Q&A", say).
 */
async function uniqueSlug(base: string, youtubeId: string): Promise<string> {
  const candidate = base || youtubeId.toLowerCase();
  const clash = await db.episode.findUnique({
    where: { slug: candidate },
    select: { youtubeId: true },
  });
  if (!clash || clash.youtubeId === youtubeId) return candidate;
  // Suffix with the video id: unique by construction, and still readable.
  return `${candidate}-${youtubeId.slice(0, 6).toLowerCase()}`;
}

async function tagConnections(names: string[]) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const tags = await Promise.all(
    unique.map((name) =>
      db.tag.upsert({
        where: { slug: slugify(name) },
        create: { name, slug: slugify(name) },
        update: {},
        select: { id: true },
      }),
    ),
  );
  return tags.map((t) => ({ id: t.id }));
}

async function upsertEpisode(video: YouTubeVideo) {
  const existing = await db.episode.findUnique({
    where: { youtubeId: video.youtubeId },
    select: { id: true, slug: true },
  });

  const slug = existing?.slug ?? (await uniqueSlug(video.slug, video.youtubeId));
  const tags = await tagConnections(video.tags);

  /**
   * Fields YouTube owns. Everything else on the record — show notes, transcript,
   * blurb, featured, status — was written here and a sync must not touch it.
   */
  const fromYouTube = {
    title: video.title,
    description: video.description,
    publishedAt: video.publishedAt,
    durationSeconds: video.durationSeconds,
    thumbnailUrl: video.thumbnailUrl,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    number: video.number,
  };

  if (existing) {
    await db.episode.update({
      where: { id: existing.id },
      data: { ...fromYouTube, tags: { set: tags } },
    });

    // Chapters come from the description, so YouTube owns them too. Replace
    // wholesale only when the description actually parsed into a list, so an
    // edit that removes the chapter block doesn't silently drop hand-fixed ones.
    if (video.chapters.length > 0) {
      await db.chapter.deleteMany({ where: { episodeId: existing.id } });
      await db.chapter.createMany({
        data: video.chapters.map((c) => ({ ...c, episodeId: existing.id })),
      });
    }
    return "updated" as const;
  }

  await db.episode.create({
    data: {
      ...fromYouTube,
      youtubeId: video.youtubeId,
      slug,
      status: video.isPublic ? "PUBLISHED" : "HIDDEN",
      tags: { connect: tags },
      chapters: { createMany: { data: video.chapters } },
    },
  });
  return "added" as const;
}

/**
 * Mirror the channel into the database. Safe to run repeatedly — it's an upsert
 * keyed on the YouTube video id.
 */
export async function syncFromYouTube(): Promise<SyncResult> {
  const run = await db.syncRun.create({ data: {}, select: { id: true } });

  try {
    const videos = await fetchChannelVideos();
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const video of videos) {
      if (video.durationSeconds < MIN_EPISODE_SECONDS) {
        skipped++;
        continue;
      }
      const outcome = await upsertEpisode(video);
      if (outcome === "added") added++;
      else updated++;
    }

    await db.syncRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), status: "ok", added, updated },
    });

    return { added, updated, skipped, total: videos.length, runId: run.id };
  } catch (error) {
    await db.syncRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function latestSyncRun() {
  return db.syncRun.findFirst({ orderBy: { startedAt: "desc" } });
}
