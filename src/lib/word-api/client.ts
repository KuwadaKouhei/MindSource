import type {
  CascadeParams,
  CascadeResponse,
  RelatedParams,
  RelatedResponse,
} from "./types";

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      body?.detail?.detail?.error ??
      body?.detail?.error ??
      body?.error ??
      `http ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return body as T;
}

export async function searchRelated(
  params: RelatedParams,
  signal?: AbortSignal,
): Promise<RelatedResponse> {
  const sp = new URLSearchParams({ word: params.word });
  if (params.top_k != null) sp.set("top_k", String(params.top_k));
  if (params.min_score != null) sp.set("min_score", String(params.min_score));
  if (params.pos?.length) sp.set("pos", params.pos.join(","));
  if (params.exclude?.length) sp.set("exclude", params.exclude.join(","));
  if (params.use_stopwords === false) sp.set("use_stopwords", "false");

  const res = await fetch(`/api/word/related?${sp.toString()}`, { signal });
  return handle<RelatedResponse>(res);
}

export async function searchCascade(
  params: CascadeParams,
  signal?: AbortSignal,
): Promise<CascadeResponse> {
  const res = await fetch(`/api/word/cascade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });
  return handle<CascadeResponse>(res);
}
