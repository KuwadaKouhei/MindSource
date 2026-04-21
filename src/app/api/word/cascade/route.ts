import { NextRequest, NextResponse } from "next/server";
import { fetchCascade, RelationWordApiError } from "@/lib/relation-word-api/server";
import type { CascadeParams } from "@/lib/relation-word-api/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Partial<CascadeParams>;
  try {
    body = (await req.json()) as Partial<CascadeParams>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.word || typeof body.word !== "string") {
    return NextResponse.json({ error: "missing_word" }, { status: 400 });
  }

  try {
    const data = await fetchCascade(body as CascadeParams);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof RelationWordApiError) {
      return NextResponse.json(
        { error: e.message, detail: e.detail },
        { status: e.status },
      );
    }
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
