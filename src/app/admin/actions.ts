"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { isSignedIn, signIn, signOut } from "@/lib/auth";
import { syncFromYouTube } from "@/lib/sync";
import { youtubeConfigured } from "@/lib/env";

export type ActionResult = { ok: boolean; message: string };

/** Every mutating action re-checks the session; none of them trust the caller. */
async function requireAdmin() {
  if (!(await isSignedIn())) throw new Error("Not authorised.");
}

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const ok = await signIn(password);
  if (!ok) {
    return { ok: false, message: "That password didn't match." };
  }
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/admin/login");
}

export async function runSyncAction(): Promise<ActionResult> {
  await requireAdmin();

  if (!youtubeConfigured) {
    return {
      ok: false,
      message: "Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID first.",
    };
  }

  try {
    const result = await syncFromYouTube();
    revalidatePath("/");
    revalidatePath("/episodes");
    revalidatePath("/admin");
    return {
      ok: true,
      message: `${result.added} added, ${result.updated} updated, ${result.skipped} skipped as too short.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sync failed.",
    };
  }
}

const episodeSchema = z.object({
  id: z.string().min(1),
  blurb: z.string().max(400).optional(),
  showNotes: z.string().max(60_000).optional(),
  transcript: z.string().max(400_000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
  featured: z.boolean(),
});

export async function saveEpisodeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = episodeSchema.safeParse({
    id: formData.get("id"),
    blurb: formData.get("blurb") || undefined,
    showNotes: formData.get("showNotes") || undefined,
    transcript: formData.get("transcript") || undefined,
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { id, featured, ...rest } = parsed.data;

  try {
    // Only one episode is the featured one, so clear the flag elsewhere first.
    if (featured) {
      await db.episode.updateMany({
        where: { featured: true, id: { not: id } },
        data: { featured: false },
      });
    }

    const episode = await db.episode.update({
      where: { id },
      data: { ...rest, featured },
      select: { slug: true },
    });

    revalidatePath("/");
    revalidatePath("/episodes");
    revalidatePath(`/episodes/${episode.slug}`);
    revalidatePath("/admin");

    return { ok: true, message: "Saved." };
  } catch (error) {
    console.error("saveEpisodeAction failed", error);
    return { ok: false, message: "Couldn't save that episode." };
  }
}
