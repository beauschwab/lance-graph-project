import { api } from "./client";

export async function getKanbanView() {
  const response = await api.get("/views/kanban");
  return response.data;
}

export async function getGanttView() {
  const response = await api.get("/views/gantt");
  return response.data;
}

export async function getTableView(type = "Issue") {
  const response = await api.get("/views/table", { params: { type } });
  return response.data;
}
