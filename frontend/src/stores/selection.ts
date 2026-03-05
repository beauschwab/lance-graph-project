import { create } from "zustand";

interface SelectionState {
  selectedIds: string[];
  setSelectedIds: (selectedIds: string[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  setSelectedIds: (selectedIds) => set({ selectedIds }),
}));
