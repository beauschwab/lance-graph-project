import { useEffect, useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { createNode, listNodes, reorderNodes, updateNode } from "../../api/nodes";
import { searchNodes } from "../../api/search";

type IssueItem = {
  issue_id: string;
  title: string;
  status: string;
  priority: number;
  sort_order: number;
};

type RowProps = {
  issue: IssueItem;
  onTitleChange: (issueId: string, value: string) => void;
  onStatusChange: (issueId: string, value: string) => void;
  selected: boolean;
  onSelect: (issueId: string) => void;
};

function SortableRow({ issue, onTitleChange, onStatusChange, selected, onSelect }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: issue.issue_id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={{ ...style, background: selected ? "#eef4ff" : "transparent" }}
      onClick={() => onSelect(issue.issue_id)}
    >
      <td style={{ width: 36 }}>
        <button type="button" aria-label="Drag row" {...attributes} {...listeners}>
          ::
        </button>
      </td>
      <td>
        <input
          defaultValue={issue.title}
          aria-label={`title-${issue.issue_id}`}
          onBlur={(event) => onTitleChange(issue.issue_id, event.target.value)}
        />
      </td>
      <td>
        <select
          value={issue.status}
          aria-label={`status-${issue.issue_id}`}
          onChange={(event) => onStatusChange(issue.issue_id, event.target.value)}
        >
          <option value="todo">todo</option>
          <option value="in_progress">in_progress</option>
          <option value="blocked">blocked</option>
          <option value="done">done</option>
        </select>
      </td>
      <td>{issue.priority}</td>
    </tr>
  );
}

type TableViewProps = {
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string) => void;
};

export function TableView({ selectedIssueId = null, onSelectIssue }: TableViewProps) {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchIds, setSearchIds] = useState<Set<string> | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  async function load() {
    const rows = (await listNodes("Issue")) as IssueItem[];
    const ordered = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    setIssues(ordered);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || activeId === overId) {
      return;
    }

    const oldIndex = issues.findIndex((item) => item.issue_id === activeId);
    const newIndex = issues.findIndex((item) => item.issue_id === overId);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reordered = arrayMove(issues, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    setIssues(reordered);
    await reorderNodes(
      "Issue",
      reordered.map((item) => ({ issue_id: item.issue_id, sort_order: item.sort_order })),
    );
  }

  async function updateField(issueId: string, updates: Partial<IssueItem>) {
    setIssues((prev) => prev.map((row) => (row.issue_id === issueId ? { ...row, ...updates } : row)));
    await updateNode("Issue", issueId, updates as Record<string, unknown>);
  }

  async function addIssue() {
    await createNode("Issue", {
      title: `New Issue ${issues.length + 1}`,
      description: "Created from table view",
      status: "todo",
      priority: 3,
      epic_id: "EPC-UNSET",
      sort_order: issues.length + 1,
      tags: [],
    });
    await load();
  }

  async function runSearch() {
    if (!query.trim()) {
      setSearchIds(null);
      return;
    }
    const rows = (await searchNodes(query)) as Array<{ issue_id?: string }>;
    const ids = new Set(rows.map((row) => row.issue_id).filter((id): id is string => Boolean(id)));
    setSearchIds(ids);
  }

  const visibleIssues = useMemo(() => {
    if (!searchIds) {
      return issues;
    }
    return issues.filter((row) => searchIds.has(row.issue_id));
  }, [issues, searchIds]);

  return (
    <section>
      <h2>Table View</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issues" />
        <button type="button" onClick={() => void runSearch()}>
          Search
        </button>
        <button type="button" onClick={() => void addIssue()}>
          Add Issue
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={(event) => void onDragEnd(event)}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th />
              <th align="left">Title</th>
              <th align="left">Status</th>
              <th align="left">Priority</th>
            </tr>
          </thead>
          <SortableContext items={visibleIssues.map((item) => item.issue_id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {visibleIssues.map((issue) => (
                <SortableRow
                  key={issue.issue_id}
                  issue={issue}
                  onTitleChange={(issueId, value) => void updateField(issueId, { title: value })}
                  onStatusChange={(issueId, value) => void updateField(issueId, { status: value })}
                  selected={selectedIssueId === issue.issue_id}
                  onSelect={(issueId) => onSelectIssue?.(issueId)}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </section>
  );
}
