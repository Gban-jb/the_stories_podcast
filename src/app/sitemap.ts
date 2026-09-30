import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllEpisodeSlugs } from "@/lib/episodes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A build without a reachable database should still produce a sitemap.
  const episodes = await getAllEpisodeSlugs().catch(() => []);

  const staticPages: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/episodes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/listen`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...episodes.map((e) => ({
      url: `${site.url}/episodes/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
