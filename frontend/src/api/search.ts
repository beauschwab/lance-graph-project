import { api } from "./client";

export async function runSearch(query: string) {
  const response = await api.post("/search", { query });
  return response.data;
}

export async function searchNodes(query: string) {
  const data = await runSearch(query);
  return data.items ?? [];
}
