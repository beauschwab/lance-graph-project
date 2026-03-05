import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GanttView } from "./GanttView";

const listNodesMock = vi.fn();
const updateNodeMock = vi.fn();
const listEdgesMock = vi.fn();
const createEdgeMock = vi.fn();

vi.mock("../../api/nodes", () => ({
  listNodes: (...args: unknown[]) => listNodesMock(...args),
  updateNode: (...args: unknown[]) => updateNodeMock(...args),
}));

vi.mock("../../api/edges", () => ({
  listEdges: (...args: unknown[]) => listEdgesMock(...args),
  createEdge: (...args: unknown[]) => createEdgeMock(...args),
}));

describe("GanttView", () => {
  it("creates a dependency by dragging connector dots", async () => {
    listNodesMock.mockResolvedValue([
      { issue_id: "ISS-A", title: "A", status: "todo", start_date: "2026-03-01", target_date: "2026-03-03" },
      { issue_id: "ISS-B", title: "B", status: "todo", start_date: "2026-03-02", target_date: "2026-03-04" },
    ]);
    listEdgesMock.mockResolvedValue([]);
    createEdgeMock.mockResolvedValue({});

    render(<GanttView />);

    await screen.findByText("A");
    const outputs = screen.getAllByTitle("Drag from this dot");
    const inputs = screen.getAllByTitle("Drop dependency here");

    const dataTransfer = {
      data: "",
      setData: vi.fn((_: string, value: string) => {
        dataTransfer.data = value;
      }),
      getData: vi.fn(() => dataTransfer.data),
    };

    fireEvent.dragStart(outputs[0], { dataTransfer });
    fireEvent.drop(inputs[1], { dataTransfer });

    await waitFor(() => {
      expect(createEdgeMock).toHaveBeenCalledWith("DEPENDS_ON", expect.objectContaining({ src_id: "ISS-A", dst_id: "ISS-B" }));
    });
  });
});
