import { NextResponse } from "next/server";
import { z } from "zod";
import { ARTIST_ERRORS } from "@/lib/errors";

/**
 * One place where every request body is turned into trusted data.
 *
 * Routes previously called `await req.json()` bare, so a truncated POST — a
 * dropped mobile connection mid-submit is the realistic case — threw before the
 * handler ran and returned an empty 500 with nothing logged. Field access was
 * then unchecked, so an absent key surfaced as a TypeError rather than a 400.
 *
 * Both failures now return a 400 the client can render, and the real cause is
 * logged server-side rather than shipped to the artist.
 */
export type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export async function parseJson<S extends z.ZodType>(
  req: Request,
  schema: S,
  invalidMessage: string = ARTIST_ERRORS.missingFields
): Promise<Parsed<z.infer<S>>> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch (e) {
    console.warn("[api:body] unparseable JSON", e);
    return {
      ok: false,
      response: NextResponse.json({ error: ARTIST_ERRORS.badRequest }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // Field paths only — never the submitted values, which are personal data.
    console.warn("[api:body] failed validation", {
      issues: result.error.issues.map((i) => ({ path: i.path.join("."), code: i.code })),
    });
    return {
      ok: false,
      response: NextResponse.json({ error: invalidMessage }, { status: 400 }),
    };
  }

  return { ok: true, data: result.data };
}

/** Body shape for admin routes that apply their own column allowlist. */
export const jsonObject = z.record(z.string(), z.unknown());
