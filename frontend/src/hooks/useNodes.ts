import { useEffect, useState } from "react";
import { listNodes } from "../api/nodes";
import type { NodeRecord } from "../types/nodes";

export function useNodes() {
  const [nodes, setNodes] = useState<NodeRecord[]>([]);

  useEffect(() => {
    listNodes("Issue").then(setNodes).catch(() => setNodes([]));
  }, []);

  return { nodes, setNodes };
}
