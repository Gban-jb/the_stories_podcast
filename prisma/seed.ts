/**
 * Preview data, so the design can be judged before the channel is connected.
 * These are invented episodes with placeholder video ids — the players won't
 * play. Run `npm run db:reset` and then a real sync to replace them.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const episodes = [
  {
    number: 6,
    title: "The night the river came back",
    slug: "the-night-the-river-came-back",
    blurb:
      "A flood took her house, her records and thirty years of tape. What she kept was the part she'd never written down.",
    durationSeconds: 3862,
    daysAgo: 4,
    tags: ["Survival", "Memory"],
    chapters: [
      [0, "Before the water"],
      [742, "The call at 2am"],
      [1866, "What she went back for"],
      [2954, "Rebuilding from memory"],
      [3510, "What the river left"],
    ] as [number, string][],
    showNotes:
      "## What we talked about\n\nThe 1997 flood is well documented. What isn't is how many people went back into the water for something no insurer would ever pay out on.\n\n- The tape archive she kept in the basement\n- Why she counted the losses in recordings, not rooms\n- The two years she spent recording it all again\n\n**Content note:** this episode describes a near drowning.",
  },
  {
    number: 5,
    title: "Forty years on the same eight miles",
    slug: "forty-years-on-the-same-eight-miles",
    blurb:
      "He drove the same bus route since 1983. He can tell you which stop someone is going to cry at.",
    durationSeconds: 4218,
    daysAgo: 11,
    tags: ["Work", "Cities"],
    chapters: [
      [0, "The first morning"],
      [905, "Learning the regulars"],
      [2140, "The stop where people cry"],
      [3388, "Handing over the keys"],
    ] as [number, string][],
  },
  {
    number: 4,
    title: "I found my father's other family",
    slug: "i-found-my-fathers-other-family",
    blurb:
      "A DNA test returned a half-sister she'd never heard of. She wrote to her that afternoon.",
    durationSeconds: 3644,
    daysAgo: 18,
    tags: ["Family", "Memory"],
    chapters: [
      [0, "The email"],
      [688, "Telling her mother"],
      [1924, "The first phone call"],
      [3012, "Two versions of one man"],
    ] as [number, string][],
  },
  {
    number: 3,
    title: "The last person who speaks it",
    slug: "the-last-person-who-speaks-it",
    blurb:
      "She is the final fluent speaker of her grandmother's language. We recorded for nine hours.",
    durationSeconds: 5106,
    daysAgo: 25,
    tags: ["Language", "Memory"],
    chapters: [
      [0, "Counting the speakers"],
      [1122, "What can't be translated"],
      [2860, "The recordings she's making"],
      [4290, "Who it's for"],
    ] as [number, string][],
  },
  {
    number: 2,
    title: "Nineteen days in the dark",
    slug: "nineteen-days-in-the-dark",
    blurb:
      "A cave survey went wrong on day two. He talks about the arithmetic of rationing light.",
    durationSeconds: 3320,
    daysAgo: 32,
    tags: ["Survival"],
    chapters: [
      [0, "Going in"],
      [612, "When the passage closed"],
      [1780, "Rationing the lamp"],
      [2704, "The sound of the rescue"],
    ] as [number, string][],
  },
  {
    number: 1,
    title: "Why we started this",
    slug: "why-we-started-this",
    blurb:
      "A short first episode about what happens when you let someone finish a sentence.",
    durationSeconds: 1284,
    daysAgo: 46,
    tags: ["Work"],
    chapters: [] as [number, string][],
  },
];

async function main() {
  console.log("Seeding preview episodes…");

  for (const [index, episode] of episodes.entries()) {
    const publishedAt = new Date(
      Date.now() - episode.daysAgo * 24 * 60 * 60 * 1000,
    );

    const tags = await Promise.all(
      episode.tags.map((name) =>
        db.tag.upsert({
          where: { slug: name.toLowerCase() },
          create: { name, slug: name.toLowerCase() },
          update: {},
          select: { id: true },
        }),
      ),
    );

    await db.episode.upsert({
      where: { youtubeId: `sample-${episode.number}` },
      update: {},
      create: {
        youtubeId: `sample-${episode.number}`,
        slug: episode.slug,
        number: episode.number,
        title: episode.title,
        blurb: episode.blurb,
        showNotes: episode.showNotes ?? null,
        durationSeconds: episode.durationSeconds,
        publishedAt,
        status: "PUBLISHED",
        // The newest one carries the hero.
        featured: index === 0,
        viewCount: Math.round(4200 / (index + 1)) * 7,
        likeCount: Math.round(310 / (index + 1)) * 3,
        tags: { connect: tags },
        chapters: {
          createMany: {
            data: episode.chapters.map(([startSeconds, title]) => ({
              startSeconds,
              title,
            })),
          },
        },
      },
    });
  }

  const total = await db.episode.count();
  console.log(`Done. ${total} episodes in the database.`);
  console.log("These are placeholders — the players won't play.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
