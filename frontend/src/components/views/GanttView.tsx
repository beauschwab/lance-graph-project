import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronRight, Circle } from "lucide-react";

import { createEdge, listEdges } from "../../api/edges";
import { listNodes, updateNode } from "../../api/nodes";
import { StatusBadge } from "../shared/StatusBadge";
import { colors, spacing, radii, typography, shadows } from "../../theme";

type Task = {
  issue_id: string;
  title: string;
  status: string;
  start_date?: string | null;
  target_date?: string | null;
  estimate_days?: number | null;
};

type Dependency = {
  src_id: string;
  dst_id: string;
};

function formatDate(value?: string | null): string {
  if (!value) {
    return "Not set";
  }
  return value.slice(0, 10);
}

function shiftDate(iso: string | null | undefined, deltaDays: number): string {
  const base = iso ? new Date(iso) : new Date();
  base.setDate(base.getDate() + deltaDays);
  return base.toISOString().slice(0, 10);
}

const ROW_HEIGHT = 48;

type GanttViewProps = {
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string) => void;
};

export function GanttView({ selectedIssueId = null, onSelectIssue }: GanttViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [linkSource, setLinkSource] = useState<string | null>(null);

  async function load() {
    const issueRows = (await listNodes("Issue")) as Task[];
    const depRows = (await listEdges("DEPENDS_ON")) as Dependency[];
    setTasks(issueRows);
    setDependencies(depRows);
  }

  useEffect(() => {
    void load();
  }, []);

  const rowIndex = useMemo(() => {
    const index: Record<string, number> = {};
    tasks.forEach((task, i) => {
      index[task.issue_id] = i;
    });
    return index;
  }, [tasks]);

  async function onDropDependency(targetId: string, sourceId: string | null) {
    if (!sourceId || sourceId === targetId) {
      return;
    }

    await createEdge("DEPENDS_ON", {
      src_id: sourceId,
      dst_id: targetId,
      dependency_type: "technical",
      lag_days: 0,
      reason: "gantt-link",
    });
    setDependencies((prev) => [...prev, { src_id: sourceId, dst_id: targetId }]);
  }

  async function shiftTask(task: Task, deltaDays: number) {
    const startDate = shiftDate(task.start_date ?? null, deltaDays);
    const targetDate = shiftDate(task.target_date ?? null, deltaDays);
    setTasks((prev) =>
      prev.map((row) =>
        row.issue_id === task.issue_id
          ? {
              ...row,
              start_date: startDate,
              target_date: targetDate,
            }
          : row,
      ),
    );
    await updateNode("Issue", task.issue_id, { start_date: startDate, target_date: targetDate });
  }

  return (
    <section className="animate-fadeIn">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.lg,
          fontSize: typography.sm,
          color: colors.textTertiary,
        }}
      >
        <Circle size={8} fill={colors.primary} color={colors.primary} />
        <span>Drag output dot to input dot to link dependencies</span>
      </div>

      <div
        style={{
          position: "relative",
          border: `1px solid ${colors.border}`,
          borderRadius: radii.lg,
          overflow: "hidden",
          background: colors.surfacePrimary,
          boxShadow: shadows.sm,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 36px 110px 110px 80px 36px",
            alignItems: "center",
            gap: spacing.md,
            padding: `${spacing.md}px ${spacing.lg}px`,
            background: colors.surfaceSecondary,
            borderBottom: `1px solid ${colors.border}`,
            fontSize: typography.xs,
            fontWeight: typography.medium,
            color: colors.textTertiary,
            textTransform: "uppercase" as const,
            letterSpacing: typography.wider,
          }}
        >
          <span>Task</span>
          <span style={{ textAlign: "center" }}>Out</span>
          <span>Start</span>
          <span>Target</span>
          <span>Shift</span>
          <span style={{ textAlign: "center" }}>In</span>
        </div>

        {/* Dependency lines SVG overlay */}
        <svg
          width="100%"
          height={Math.max(120, tasks.length * ROW_HEIGHT)}
          style={{ position: "absolute", top: 36, left: 0, pointerEvents: "none" }}
        >
          {dependencies.map((edge, idx) => {
            const src = rowIndex[edge.src_id];
            const dst = rowIndex[edge.dst_id];
            if (src === undefined || dst === undefined) {
              return null;
            }
            const y1 = src * ROW_HEIGHT + ROW_HEIGHT / 2;
            const y2 = dst * ROW_HEIGHT + ROW_HEIGHT / 2;
            return (
              <path
                key={`${edge.src_id}-${edge.dst_id}-${idx}`}
                d={`M 276 ${y1} C 330 ${y1}, 330 ${y2}, 384 ${y2}`}
                stroke={colors.primary}
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
                strokeDasharray="4 2"
              />
            );
          })}
        </svg>

        <div style={{ position: "relative", zIndex: 2 }}>
          {tasks.map((task) => (
            <div
              key={task.issue_id}
              onClick={() => onSelectIssue?.(task.issue_id)}
              style={{
                display: "grid",
                gridTemplateColumns: "240px 36px 110px 110px 80px 36px",
                alignItems: "center",
                gap: spacing.md,
                padding: `0 ${spacing.lg}px`,
                height: ROW_HEIGHT,
                borderBottom: `1px solid ${colors.borderLight}`,
                background: task.issue_id === selectedIssueId ? colors.surfaceSelected : colors.surfacePrimary,
                cursor: "pointer",
                transition: "background 100ms ease",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: typography.base,
                    fontWeight: typography.medium,
                    color: colors.textPrimary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {task.title}
                </div>
                <div style={{ marginTop: 1 }}>
                  <StatusBadge value={task.status} />
                </div>
              </div>

              {/* Output dot */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  title="Drag from this dot"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", task.issue_id);
                    setLinkSource(task.issue_id);
                  }}
                  onDragEnd={() => setLinkSource(null)}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: radii.pill,
                    background: colors.primary,
                    cursor: "grab",
                    border: `2px solid ${colors.surfacePrimary}`,
                    boxShadow: shadows.sm,
                    transition: "transform 150ms ease",
                  }}
                />
              </div>

              <span style={{ fontSize: typography.sm, color: colors.textSecondary, fontFamily: typography.monoFamily }}>
                {formatDate(task.start_date)}
              </span>
              <span style={{ fontSize: typography.sm, color: colors.textSecondary, fontFamily: typography.monoFamily }}>
                {formatDate(task.target_date)}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void shiftTask(task, 1);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.xxs,
                  padding: `${spacing.xxs}px ${spacing.md}px`,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.sm,
                  background: colors.surfacePrimary,
                  color: colors.textSecondary,
                  fontSize: typography.xs,
                  fontWeight: typography.medium,
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={12} />
                +1d
              </button>

              {/* Input dot */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                  title={linkSource ? `Drop to link ${linkSource} → ${task.issue_id}` : "Drop dependency here"}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = event.dataTransfer.getData("text/plain") || linkSource;
                    void onDropDependency(task.issue_id, sourceId || null);
                    setLinkSource(null);
                  }}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: radii.pill,
                    background: colors.statusDone,
                    border: `2px solid ${colors.surfacePrimary}`,
                    boxShadow: shadows.sm,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
