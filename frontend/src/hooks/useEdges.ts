import { useEffect, useState } from "react";
import { listEdges } from "../api/edges";
import type { EdgeRecord } from "../types/edges";

export function useEdges() {
  const [edges, setEdges] = useState<EdgeRecord[]>([]);

  useEffect(() => {
    listEdges().then(setEdges).catch(() => setEdges([]));
  }, []);

  return { edges, setEdges };
}
