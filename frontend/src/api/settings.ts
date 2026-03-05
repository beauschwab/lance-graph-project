import { api } from "./client";

export async function listTeams() {
  const response = await api.get("/settings/teams");
  return response.data.items ?? [];
}

export async function createTeam(data: Record<string, unknown>) {
  const response = await api.post("/settings/teams", { data });
  return response.data;
}

export async function listPeople() {
  const response = await api.get("/settings/people");
  return response.data.items ?? [];
}

export async function listApplications() {
  const response = await api.get("/settings/applications");
  return response.data.items ?? [];
}

export async function listStatuses() {
  const response = await api.get("/settings/statuses");
  return response.data.items ?? [];
}

export async function listPriorities() {
  const response = await api.get("/settings/priorities");
  return response.data.items ?? [];
}

export async function listTags() {
  const response = await api.get("/settings/tags");
  return response.data.items ?? [];
}
