import { useEffect, useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Search } from "lucide-react";

import { createNode, listNodes, reorderNodes, updateNode } from "../../api/nodes";
import { searchNodes } from "../../api/search";
import { StatusBadge } from "../shared/StatusBadge";
import { PriorityPill } from "../shared/PriorityPill";
import { colors, spacing, radii, typography, shadows } from "../../theme";

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

const cellStyle: React.CSSProperties = {
  padding: `${spacing.md}px ${spacing.lg}px`,
  borderBottom: `1px solid ${colors.borderLight}`,
  fontSize: typography.base,
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontSize: typography.xs,
  fontWeight: typography.medium,
  color: colors.textTertiary,
  textTransform: "uppercase",
  letterSpacing: typography.wider,
  background: colors.surfaceSecondary,
  borderBottom: `1px solid ${colors.border}`,
  position: "sticky",
  top: 0,
  zIndex: 1,
};

function SortableRow({ issue, onTitleChange, onStatusChange, selected, onSelect }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: issue.issue_id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    background: selected ? colors.surfaceSelected : colors.surfacePrimary,
    cursor: "pointer",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(issue.issue_id)}
    >
      <td style={{ ...cellStyle, width: 36, padding: `0 ${spacing.xs}px`, textAlign: "center" }}>
        <button
          type="button"
          aria-label="Drag row"
          {...attributes}
          {...listeners}
          style={{
            border: "none",
            background: "transparent",
            cursor: "grab",
            color: colors.textTertiary,
            padding: spacing.xs,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GripVertical size={14} />
        </button>
      </td>
      <td style={{ ...cellStyle, fontWeight: typography.medium, color: colors.textPrimary }}>
        <input
          defaultValue={issue.title}
          aria-label={`title-${issue.issue_id}`}
          onBlur={(event) => onTitleChange(issue.issue_id, event.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            border: "none",
            background: "transparent",
            width: "100%",
            fontSize: typography.base,
            fontWeight: typography.medium,
            color: colors.textPrimary,
            padding: `${spacing.xxs}px 0`,
            outline: "none",
          }}
        />
      </td>
      <td style={cellStyle}>
        <StatusBadge value={issue.status} />
      </td>
      <td style={cellStyle}>
        <PriorityPill value={String(issue.priority)} />
      </td>
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
    <section className="animate-fadeIn">
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.md,
          marginBottom: spacing.xl,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            flex: 1,
            maxWidth: 360,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            background: colors.surfacePrimary,
            boxShadow: shadows.xs,
          }}
        >
          <Search size={14} color={colors.textTertiary} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }}
            placeholder="Search issues..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontSize: typography.base,
              color: colors.textPrimary,
              outline: "none",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => void runSearch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            background: colors.surfacePrimary,
            color: colors.textSecondary,
            fontSize: typography.sm,
            fontWeight: typography.medium,
            cursor: "pointer",
            boxShadow: shadows.xs,
          }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => void addIssue()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.xs,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            border: "none",
            borderRadius: radii.md,
            background: colors.primary,
            color: colors.primaryText,
            fontSize: typography.sm,
            fontWeight: typography.medium,
            cursor: "pointer",
            boxShadow: shadows.sm,
          }}
        >
          <Plus size={14} />
          Add Issue
        </button>

        <div style={{ marginLeft: "auto", fontSize: typography.xs, color: colors.textTertiary }}>
          {visibleIssues.length} issue{visibleIssues.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: radii.lg,
          overflow: "hidden",
          background: colors.surfacePrimary,
          boxShadow: shadows.sm,
        }}
      >
        <DndContext sensors={sensors} onDragEnd={(event) => void onDragEnd(event)}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...headerCellStyle, width: 36 }} />
                <th style={{ ...headerCellStyle, textAlign: "left" }}>Title</th>
                <th style={{ ...headerCellStyle, textAlign: "left", width: 140 }}>Status</th>
                <th style={{ ...headerCellStyle, textAlign: "left", width: 120 }}>Priority</th>
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
      </div>
    </section>
  );
}
