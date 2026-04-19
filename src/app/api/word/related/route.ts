import { NextRequest, NextResponse } from "next/server";
import { fetchRelated, WordApiError } from "@/lib/word-api/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const word = sp.get("word");
  if (!word) {
    return NextResponse.json({ error: "missing_word" }, { status: 400 });
  }

  const top_k = sp.get("top_k") ? Number(sp.get("top_k")) : undefined;
  const min_score = sp.get("min_score") ? Number(sp.get("min_score")) : undefined;
  const pos = sp.get("pos")?.split(",").map((s) => s.trim()).filter(Boolean);
  const exclude = sp.get("exclude")?.split(",").map((s) => s.trim()).filter(Boolean);
  const use_stopwords = sp.get("use_stopwords") === "false" ? false : undefined;

  try {
    const data = await fetchRelated({ word, top_k, min_score, pos, exclude, use_stopwords });
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof WordApiError) {
      return NextResponse.json(
        { error: e.message, detail: e.detail },
        { status: e.status },
      );
    }
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
