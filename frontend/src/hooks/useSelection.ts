import { useSelectionStore } from "../stores/selection";

export function useSelection() {
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const setSelectedIds = useSelectionStore((state) => state.setSelectedIds);
  return { selectedIds, setSelectedIds };
}
