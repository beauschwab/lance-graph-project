import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { listNodes, reorderNodes, updateNode } from "../../api/nodes";
import { PriorityPill } from "../shared/PriorityPill";
import { colors, spacing, radii, typography, shadows, getStatusStyle } from "../../theme";

type IssueItem = {
  issue_id: string;
  title: string;
  status: string;
  priority: number;
  sort_order: number;
};

const STATUSES = ["todo", "in_progress", "blocked", "done"];

function KanbanCard({
  issue,
  selected,
  onSelect,
}: {
  issue: IssueItem;
  selected: boolean;
  onSelect: (issueId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: issue.issue_id,
    data: { status: issue.status },
  });

  const statusStyle = getStatusStyle(issue.status);

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        border: selected ? `1.5px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
        borderRadius: radii.lg,
        padding: spacing.lg,
        background: selected ? colors.surfaceSelected : colors.surfacePrimary,
        cursor: "pointer",
        boxShadow: selected ? shadows.md : shadows.xs,
      }}
      onClick={() => onSelect(issue.issue_id)}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm }}>
        <strong
          style={{
            fontSize: typography.base,
            fontWeight: typography.medium,
            color: colors.textPrimary,
            lineHeight: typography.tight,
          }}
        >
          {issue.title}
        </strong>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginTop: spacing.md }}>
        <PriorityPill value={String(issue.priority)} />
        <span
          style={{
            marginLeft: "auto",
            fontSize: "9px",
            fontWeight: typography.medium,
            color: statusStyle.color,
            textTransform: "uppercase",
            letterSpacing: typography.widest,
          }}
        >
          {statusStyle.label}
        </span>
      </div>
    </article>
  );
}

function KanbanColumn({
  status,
  issues,
  selectedIssueId,
  onSelectIssue,
}: {
  status: string;
  issues: IssueItem[];
  selectedIssueId: string | null;
  onSelectIssue?: (issueId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}`, data: { status } });
  const statusStyle = getStatusStyle(status);

  return (
    <section
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 260,
        borderRadius: radii.xl,
        padding: spacing.lg,
        background: isOver ? colors.surfaceHover : colors.surfaceSecondary,
        border: isOver ? `1.5px dashed ${colors.primary}` : `1px solid ${colors.borderLight}`,
        transition: "all 200ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.lg,
          padding: `0 ${spacing.xs}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: statusStyle.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: typography.sm,
              fontWeight: typography.semibold,
              color: colors.textPrimary,
              textTransform: "capitalize",
            }}
          >
            {statusStyle.label}
          </span>
        </div>
        <span
          style={{
            fontSize: typography.xs,
            fontWeight: typography.medium,
            color: colors.textTertiary,
            background: colors.surfacePrimary,
            padding: `1px ${spacing.sm}px`,
            borderRadius: radii.pill,
            border: `1px solid ${colors.borderLight}`,
          }}
        >
          {issues.length}
        </span>
      </div>
      <SortableContext items={issues.map((issue) => issue.issue_id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "grid", gap: spacing.md }}>
          {issues.map((issue) => (
            <KanbanCard
              key={issue.issue_id}
              issue={issue}
              selected={issue.issue_id === selectedIssueId}
              onSelect={(issueId) => onSelectIssue?.(issueId)}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

type KanbanViewProps = {
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string) => void;
};

export function KanbanView({ selectedIssueId = null, onSelectIssue }: KanbanViewProps) {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  async function load() {
    const rows = (await listNodes("Issue")) as IssueItem[];
    setIssues(rows);
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, IssueItem[]> = Object.fromEntries(STATUSES.map((status) => [status, []]));
    for (const issue of issues) {
      const status = STATUSES.includes(issue.status) ? issue.status : "todo";
      map[status].push(issue);
    }
    for (const status of STATUSES) {
      map[status].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return map;
  }, [issues]);

  async function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) {
      return;
    }

    const activeIssue = issues.find((row) => row.issue_id === activeId);
    if (!activeIssue) {
      return;
    }

    const targetStatus = overId.startsWith("col-")
      ? overId.replace("col-", "")
      : (issues.find((row) => row.issue_id === overId)?.status ?? activeIssue.status);

    let next = [...issues];
    if (activeIssue.status !== targetStatus) {
      next = next.map((row) =>
        row.issue_id === activeId
          ? {
              ...row,
              status: targetStatus,
              sort_order: (grouped[targetStatus]?.length ?? 0) + 1,
            }
          : row,
      );
      setIssues(next);
      await updateNode("Issue", activeId, { status: targetStatus });
      return;
    }

    if (activeId !== overId) {
      const sameCol = next.filter((row) => row.status === targetStatus).sort((a, b) => a.sort_order - b.sort_order);
      const oldIndex = sameCol.findIndex((row) => row.issue_id === activeId);
      const newIndex = sameCol.findIndex((row) => row.issue_id === overId);
      if (oldIndex >= 0 && newIndex >= 0) {
        const reorderedCol = arrayMove(sameCol, oldIndex, newIndex).map((row, index) => ({
          ...row,
          sort_order: index + 1,
        }));
        const reorderedById = new Map(reorderedCol.map((row) => [row.issue_id, row]));
        next = next.map((row) => reorderedById.get(row.issue_id) ?? row);
        setIssues(next);
        await reorderNodes(
          "Issue",
          reorderedCol.map((row) => ({ issue_id: row.issue_id, sort_order: row.sort_order })),
        );
      }
    }
  }

  return (
    <section className="animate-fadeIn">
      <DndContext sensors={sensors} onDragEnd={(event) => void onDragEnd(event)}>
        <div style={{ display: "flex", gap: spacing.lg, alignItems: "flex-start", overflowX: "auto", paddingBottom: spacing.md }}>
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              issues={grouped[status] ?? []}
              selectedIssueId={selectedIssueId}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>
      </DndContext>
    </section>
  );
}
