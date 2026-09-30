import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  email: z.string().email().max(254),
  source: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That doesn't look like an email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    /**
     * Upsert rather than create: signing up twice should be a no-op, not an
     * error, and it keeps the endpoint from confirming whether an address is
     * already on the list.
     */
    await db.subscriber.upsert({
      where: { email },
      create: { email, source: parsed.data.source },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/subscribe failed", error);
    return NextResponse.json(
      { error: "Couldn't save that right now. Try again in a moment." },
      { status: 500 },
    );
  }
}
