export type RelatedItem = {
  word: string;
  score: number;
  pos: string | null;
};

export type Meta = {
  model: string;
  cached: boolean;
  elapsed_ms: number;
};

export type RelatedResponse = {
  query: string;
  results: RelatedItem[];
  meta: Meta;
};

export type CascadeNode = {
  id: string;
  word: string;
  generation: number;
  score: number | null;
  parent: string | null;
};

export type CascadeEdge = {
  from: string;
  to: string;
  score: number;
};

export type CascadeResponse = {
  query: string;
  nodes: CascadeNode[];
  edges: CascadeEdge[];
  meta: Meta & { truncated?: boolean };
};

export type RelatedParams = {
  word: string;
  top_k?: number;
  min_score?: number;
  pos?: string[];
  use_stopwords?: boolean;
  exclude?: string[];
};

export type CascadeParams = {
  word: string;
  depth?: number;
  top_k?: number;
  min_score?: number;
  pos?: string[];
  exclude?: string[];
  use_stopwords?: boolean;
  max_nodes?: number;
};
