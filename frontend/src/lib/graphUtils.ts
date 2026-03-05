import type { EdgeRecord } from "../types/edges";

export function buildAdjacency(edges: EdgeRecord[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const edge of edges) {
    map[edge.src_id] ??= [];
    map[edge.src_id].push(edge.dst_id);
  }
  return map;
}
