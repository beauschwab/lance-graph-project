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

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        border: selected ? "1px solid #3b82f6" : "1px solid #ddd",
        borderRadius: 8,
        padding: 8,
        background: selected ? "#eef4ff" : "#fff",
      }}
      onClick={() => onSelect(issue.issue_id)}
      {...attributes}
      {...listeners}
    >
      <strong>{issue.title}</strong>
      <div>Priority {issue.priority}</div>
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

  return (
    <section
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 250,
        border: "1px solid #e0e0e0",
        borderRadius: 10,
        padding: 10,
        background: isOver ? "#f5faff" : "#fafafa",
      }}
    >
      <h3>{status}</h3>
      <SortableContext items={issues.map((issue) => issue.issue_id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "grid", gap: 8 }}>
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
    <section>
      <h2>Kanban View</h2>
      <DndContext sensors={sensors} onDragEnd={(event) => void onDragEnd(event)}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", overflowX: "auto" }}>
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
