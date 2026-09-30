/**
 * Everything about the show that isn't an episode.
 * This is the file to edit when the brand, the blurb or a channel URL changes.
 */

export const site = {
  name: "Stories",
  /** Shown after the name in the title bar and on social cards. */
  tagline: "A podcast of true accounts, told once, at length.",
  description:
    "Long-form conversations with people who lived through something worth an hour of your attention. New episode every Thursday, filmed and released on YouTube.",
  /** Set this to the deployed origin before launch — used for canonical URLs and social cards. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en_US",
  /** Used in the footer and the subscribe copy. */
  cadence: "Thursdays",
} as const;

export type Channel = {
  id: string;
  label: string;
  /** What the viewer actually gets there, in their words not ours. */
  note: string;
  href: string;
  /** Drawn from src/components/channel-icon.tsx */
  icon: "youtube" | "instagram" | "tiktok" | "facebook" | "linkedin" | "rss";
  /** The one place we'd rather people land. Exactly one channel should set this. */
  primary?: boolean;
};

/**
 * The show's channels. Replace the placeholder handles with the real ones —
 * every link here is rendered on /listen and in the footer.
 */
export const channels: Channel[] = [
  {
    id: "youtube",
    label: "YouTube",
    note: "Every episode, filmed, in full.",
    href: "https://www.youtube.com/@your-handle",
    icon: "youtube",
    primary: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    note: "Clips and stills between episodes.",
    href: "https://www.instagram.com/your-handle",
    icon: "instagram",
  },
  {
    id: "tiktok",
    label: "TikTok",
    note: "The moments that travel on their own.",
    href: "https://www.tiktok.com/@your-handle",
    icon: "tiktok",
  },
  {
    id: "facebook",
    label: "Facebook",
    note: "Episode threads and listener replies.",
    href: "https://www.facebook.com/your-handle",
    icon: "facebook",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    note: "Notes on how the show gets made.",
    href: "https://www.linkedin.com/company/your-handle",
    icon: "linkedin",
  },
];

export const primaryChannel =
  channels.find((c) => c.primary) ?? channels[0];

/** Who makes it. Rendered on /about. */
export const hosts = [
  {
    name: "Your Name",
    role: "Host",
    bio: "Add a few lines here. What draws you to a story, and what you do with it once someone trusts you enough to tell it.",
    avatarUrl: null as string | null,
  },
];
