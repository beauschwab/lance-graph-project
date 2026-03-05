import { api } from "./client";

export async function listEdges(type = "DEPENDS_ON") {
  const response = await api.get(`/edges/${type}`);
  return response.data.items ?? [];
}

export async function createEdge(type: string, data: Record<string, unknown>) {
  const response = await api.post(`/edges/${type}`, { data });
  return response.data;
}
