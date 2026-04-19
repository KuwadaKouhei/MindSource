// Custom-event bridge so the WordNode component can request a rename without
// holding a direct reference to the Y.Doc (which only the editor hook owns).

export const createMindmapDocHandle = {
  RENAME_EVENT: "mindsource:node-rename" as const,
};

export type NodeRenameDetail = { id: string; word: string };
