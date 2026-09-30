import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

/** Cards and lists never need the transcript; it's the largest column by far. */
const cardSelect = {
  id: true,
  youtubeId: true,
  slug: true,
  number: true,
  title: true,
  blurb: true,
  thumbnailUrl: true,
  durationSeconds: true,
  publishedAt: true,
  viewCount: true,
  featured: true,
} satisfies Prisma.EpisodeSelect;

export type EpisodeCard = Prisma.EpisodeGetPayload<{ select: typeof cardSelect }>;

const visible: Prisma.EpisodeWhereInput = { status: "PUBLISHED" };

export async function getLatestEpisodes(take = 6): Promise<EpisodeCard[]> {
  return db.episode.findMany({
    where: visible,
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

/**
 * The hero episode: whichever one is flagged featured, else the newest. Falls
 * back rather than rendering an empty hero on a fresh install.
 */
export async function getFeaturedEpisode(): Promise<EpisodeCard | null> {
  const flagged = await db.episode.findFirst({
    where: { ...visible, featured: true },
    orderBy: { publishedAt: "desc" },
    select: cardSelect,
  });
  if (flagged) return flagged;
  return db.episode.findFirst({
    where: visible,
    orderBy: { publishedAt: "desc" },
    select: cardSelect,
  });
}

export async function getEpisodeBySlug(slug: string) {
  return db.episode.findFirst({
    where: { slug, ...visible },
    include: {
      chapters: { orderBy: { startSeconds: "asc" } },
      tags: { orderBy: { name: "asc" } },
      guests: true,
    },
  });
}

export type EpisodeDetail = NonNullable<
  Awaited<ReturnType<typeof getEpisodeBySlug>>
>;

export type SearchOptions = {
  query?: string;
  tag?: string;
  page?: number;
  perPage?: number;
  /** "newest" | "oldest" | "longest" */
  sort?: string;
};

export async function searchEpisodes(options: SearchOptions = {}) {
  const perPage = Math.min(Math.max(options.perPage ?? 12, 1), 48);
  const page = Math.max(options.page ?? 1, 1);
  const q = options.query?.trim();

  const where: Prisma.EpisodeWhereInput = {
    ...visible,
    ...(options.tag ? { tags: { some: { slug: options.tag } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { blurb: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { transcript: { contains: q, mode: "insensitive" } },
            { guests: { some: { name: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.EpisodeOrderByWithRelationInput =
    options.sort === "oldest"
      ? { publishedAt: "asc" }
      : options.sort === "longest"
        ? { durationSeconds: "desc" }
        : { publishedAt: "desc" };

  const [episodes, total] = await Promise.all([
    db.episode.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: cardSelect,
    }),
    db.episode.count({ where }),
  ]);

  return {
    episodes,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Neighbours by publish date, for the "keep going" links at the foot of an
 * episode. Newer first because that's the direction people browse.
 */
export async function getAdjacentEpisodes(episode: {
  id: string;
  publishedAt: Date;
}) {
  const [newer, older] = await Promise.all([
    db.episode.findFirst({
      where: { ...visible, publishedAt: { gt: episode.publishedAt } },
      orderBy: { publishedAt: "asc" },
      select: cardSelect,
    }),
    db.episode.findFirst({
      where: { ...visible, publishedAt: { lt: episode.publishedAt } },
      orderBy: { publishedAt: "desc" },
      select: cardSelect,
    }),
  ]);
  return { newer, older };
}

/** Shares at least one tag, excluding the episode itself. */
export async function getRelatedEpisodes(
  episodeId: string,
  tagSlugs: string[],
  take = 3,
): Promise<EpisodeCard[]> {
  if (tagSlugs.length === 0) return [];
  return db.episode.findMany({
    where: {
      ...visible,
      id: { not: episodeId },
      tags: { some: { slug: { in: tagSlugs } } },
    },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

export async function getAllTags() {
  return db.tag.findMany({
    where: { episodes: { some: visible } },
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { episodes: true } },
    },
  });
}

/** Runtimes newest→oldest, which is what the waveform dividers are drawn from. */
export async function getRuntimeSeries(take = 120): Promise<number[]> {
  const rows = await db.episode.findMany({
    where: visible,
    orderBy: { publishedAt: "desc" },
    take,
    select: { durationSeconds: true },
  });
  return rows.map((r) => r.durationSeconds);
}

export async function getShowStats() {
  const [count, agg] = await Promise.all([
    db.episode.count({ where: visible }),
    db.episode.aggregate({
      where: visible,
      _sum: { durationSeconds: true },
      _max: { publishedAt: true },
    }),
  ]);
  return {
    episodeCount: count,
    totalSeconds: agg._sum.durationSeconds ?? 0,
    latestPublishedAt: agg._max.publishedAt,
  };
}

export async function getAllEpisodeSlugs() {
  return db.episode.findMany({
    where: visible,
    orderBy: { publishedAt: "desc" },
    select: { slug: true, updatedAt: true },
  });
}

/** The hero needs chapters too, so it can offer them as entry points. */
export async function getFeaturedEpisodeWithChapters() {
  const featured = await getFeaturedEpisode();
  if (!featured) return null;
  const chapters = await db.chapter.findMany({
    where: { episodeId: featured.id },
    orderBy: { startSeconds: "asc" },
    take: 8,
  });
  return { ...featured, chapters };
}
