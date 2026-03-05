import { api } from "./client";

export async function getBottlenecks() {
  const response = await api.get("/analyze/bottlenecks");
  return response.data.items ?? [];
}

export async function getCriticalPath(milestoneId: string) {
  const response = await api.get(`/analyze/critical-path/${milestoneId}`);
  return response.data;
}

export async function getTeamWorkload() {
  const response = await api.get("/analyze/workload");
  return response.data.items ?? [];
}

export async function getStaleBlockers(thresholdDays = 14) {
  const response = await api.get("/analyze/stale-blockers", { params: { threshold_days: thresholdDays } });
  return response.data.items ?? [];
}

export async function getHandoffHotspots() {
  const response = await api.get("/analyze/handoff-hotspots");
  return response.data.items ?? [];
}

export async function runImpactAnalysis(itemId: string, slipDays: number) {
  const response = await api.post("/analyze/impact", { item_id: itemId, slip_days: slipDays });
  return response.data;
}
