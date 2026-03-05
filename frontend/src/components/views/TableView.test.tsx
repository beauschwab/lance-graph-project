import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableView } from "./TableView";

const listNodesMock = vi.fn();
const updateNodeMock = vi.fn();
const reorderNodesMock = vi.fn();
const createNodeMock = vi.fn();
const searchNodesMock = vi.fn();

vi.mock("../../api/nodes", () => ({
  listNodes: (...args: unknown[]) => listNodesMock(...args),
  updateNode: (...args: unknown[]) => updateNodeMock(...args),
  reorderNodes: (...args: unknown[]) => reorderNodesMock(...args),
  createNode: (...args: unknown[]) => createNodeMock(...args),
}));

vi.mock("../../api/search", () => ({
  searchNodes: (...args: unknown[]) => searchNodesMock(...args),
}));

describe("TableView", () => {
  it("updates issue title inline", async () => {
    listNodesMock.mockResolvedValue([
      { issue_id: "ISS-1", title: "Initial", status: "todo", priority: 2, sort_order: 1 },
    ]);
    updateNodeMock.mockResolvedValue({});
    searchNodesMock.mockResolvedValue([]);

    render(<TableView />);

    const titleInput = await screen.findByLabelText("title-ISS-1");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(updateNodeMock).toHaveBeenCalledWith("Issue", "ISS-1", { title: "Updated Title" });
    });
  });
});
