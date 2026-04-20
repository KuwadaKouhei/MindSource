import "server-only";
import type {
  CascadeParams,
  CascadeResponse,
  RelatedParams,
  RelatedResponse,
} from "./types";

function getConfig() {
  const base = process.env.WORD_API_BASE_URL;
  const key = process.env.WORD_API_KEY;
  if (!base || !key) {
    throw new Error("WORD_API_BASE_URL / WORD_API_KEY not configured");
  }
  return { base, key };
}

class WordApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let detail: unknown = text;
    try {
      detail = JSON.parse(text);
    } catch {}
    throw new WordApiError(res.status, `word-api ${res.status}`, detail);
  }
  return JSON.parse(text) as T;
}

async function fetchWordApi(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (e) {
    const err = e as Error;
    if (err.name === "AbortError") {
      throw new WordApiError(504, "word-api timeout (15s)", { url });
    }
    throw new WordApiError(
      502,
      `word-api unreachable: ${err.message}`,
      { url, cause: err.message },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRelated(params: RelatedParams): Promise<RelatedResponse> {
  const { base, key } = getConfig();
  const url = new URL("/v1/related", base);
  url.searchParams.set("word", params.word);
  url.searchParams.set("top_k", String(params.top_k ?? 10));
  url.searchParams.set("min_score", String(params.min_score ?? 0.5));
  if (params.pos?.length) url.searchParams.set("pos", params.pos.join(","));
  if (params.exclude?.length) url.searchParams.set("exclude", params.exclude.join(","));
  if (params.use_stopwords === false) url.searchParams.set("use_stopwords", "false");

  const res = await fetchWordApi(url.toString(), {
    headers: { "X-API-Key": key },
  });
  return parseResponse<RelatedResponse>(res);
}

export async function fetchCascade(params: CascadeParams): Promise<CascadeResponse> {
  const { base, key } = getConfig();
  const url = new URL("/v1/cascade", base);

  const body: Record<string, unknown> = { word: params.word };
  if (params.depth != null) body.depth = params.depth;
  if (params.top_k != null) body.top_k = params.top_k;
  if (params.min_score != null) body.min_score = params.min_score;
  if (params.pos?.length) body.pos = params.pos;
  if (params.exclude?.length) body.exclude = params.exclude;
  if (params.use_stopwords === false) body.use_stopwords = false;
  if (params.max_nodes != null) body.max_nodes = params.max_nodes;

  const res = await fetchWordApi(url.toString(), {
    method: "POST",
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse<CascadeResponse>(res);
}

export { WordApiError };
