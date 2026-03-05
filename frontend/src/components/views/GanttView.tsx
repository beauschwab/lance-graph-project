import { useEffect, useMemo, useState } from "react";

import { createEdge, listEdges } from "../../api/edges";
import { listNodes, updateNode } from "../../api/nodes";

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
    return "";
  }
  return value.slice(0, 10);
}

function shiftDate(iso: string | null | undefined, deltaDays: number): string {
  const base = iso ? new Date(iso) : new Date();
  base.setDate(base.getDate() + deltaDays);
  return base.toISOString().slice(0, 10);
}

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
    <section>
      <h2>Gantt View</h2>
      <p>Drag from output dot to input dot to create dependencies.</p>

      <div style={{ position: "relative", border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden" }}>
        <svg width="100%" height={Math.max(120, tasks.length * 52)} style={{ position: "absolute", top: 0, left: 0 }}>
          {dependencies.map((edge, idx) => {
            const src = rowIndex[edge.src_id];
            const dst = rowIndex[edge.dst_id];
            if (src === undefined || dst === undefined) {
              return null;
            }
            const y1 = src * 52 + 24;
            const y2 = dst * 52 + 24;
            return (
              <path
                key={`${edge.src_id}-${edge.dst_id}-${idx}`}
                d={`M 260 ${y1} C 310 ${y1}, 310 ${y2}, 360 ${y2}`}
                stroke="#6b7280"
                strokeWidth="1.5"
                fill="none"
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
                gridTemplateColumns: "220px 40px 120px 120px 120px 40px",
                alignItems: "center",
                gap: 8,
                padding: 8,
                borderBottom: "1px solid #efefef",
                background: task.issue_id === selectedIssueId ? "#eef4ff" : "rgba(255,255,255,0.94)",
              }}
            >
              <div>
                <strong>{task.title}</strong>
                <div style={{ fontSize: 12, color: "#666" }}>{task.status}</div>
              </div>

              <div
                title="Drag from this dot"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", task.issue_id);
                  setLinkSource(task.issue_id);
                }}
                onDragEnd={() => setLinkSource(null)}
                style={{ width: 14, height: 14, borderRadius: 99, background: "#0ea5e9", justifySelf: "center", cursor: "grab" }}
              />

              <span>{formatDate(task.start_date)}</span>
              <span>{formatDate(task.target_date)}</span>

              <button type="button" onClick={() => void shiftTask(task, 1)}>
                +1 day
              </button>

              <div
                title={linkSource ? `Drop to link ${linkSource} -> ${task.issue_id}` : "Drop dependency here"}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData("text/plain") || linkSource;
                  void onDropDependency(task.issue_id, sourceId || null);
                  setLinkSource(null);
                }}
                style={{ width: 14, height: 14, borderRadius: 99, background: "#22c55e", justifySelf: "center" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
