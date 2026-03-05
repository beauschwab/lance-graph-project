import { useState } from "react";
import { searchNodes } from "../api/search";
import type { NodeRecord } from "../types/nodes";

export function useSearch() {
  const [results, setResults] = useState<NodeRecord[]>([]);

  async function run(query: string) {
    const items = await searchNodes(query);
    setResults(items);
  }

  return { results, run };
}
