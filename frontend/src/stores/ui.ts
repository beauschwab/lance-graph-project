import { create } from "zustand";

type ViewType = "table" | "kanban" | "gantt";

interface UiState {
  view: ViewType;
  setView: (view: ViewType) => void;
}

export const useUiStore = create<UiState>((set) => ({
  view: "table",
  setView: (view) => set({ view }),
}));
