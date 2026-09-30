import { NextResponse } from "next/server";
import { z } from "zod";
import { searchEpisodes } from "@/lib/episodes";

const querySchema = z.object({
  q: z.string().max(200).optional(),
  tag: z.string().max(80).optional(),
  sort: z.enum(["newest", "oldest", "longest"]).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  perPage: z.coerce.number().int().min(1).max(48).optional(),
});

/** Public, read-only list of published episodes. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await searchEpisodes({
      query: parsed.data.q,
      tag: parsed.data.tag,
      sort: parsed.data.sort,
      page: parsed.data.page,
      perPage: parsed.data.perPage,
    });

    return NextResponse.json(result, {
      headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("GET /api/episodes failed", error);
    return NextResponse.json({ error: "Could not load episodes." }, { status: 500 });
  }
}
