import { api } from "./client";

export async function listNodes(type: string) {
  const response = await api.get(`/nodes/${type}`);
  return response.data.items ?? [];
}

export async function createNode(type: string, data: Record<string, unknown>) {
  const response = await api.post(`/nodes/${type}`, { data });
  return response.data;
}

export async function getNode(type: string, id: string) {
  const response = await api.get(`/nodes/${type}/${id}`);
  return response.data;
}

export async function updateNode(type: string, id: string, data: Record<string, unknown>) {
  const response = await api.put(`/nodes/${type}/${id}`, { data });
  return response.data;
}

export async function reorderNodes(
  type: string,
  items: Array<{ issue_id?: string; [key: string]: unknown }>,
) {
  const response = await api.patch(`/nodes/${type}/reorder`, { items });
  return response.data;
}
