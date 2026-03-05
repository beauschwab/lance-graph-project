import { useState } from "react";

import { getCriticalPath } from "../../api/analysis";

type PathNode = { id: string; title: string; estimate_days: number };

export function CriticalPathView() {
  const [milestoneId, setMilestoneId] = useState("MS-1");
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [duration, setDuration] = useState(0);

  async function run() {
    const result = await getCriticalPath(milestoneId);
    setNodes(result.path ?? []);
    setDuration(result.total_duration_days ?? 0);
  }

  return (
    <section>
      <h3>Critical Path</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input value={milestoneId} onChange={(event) => setMilestoneId(event.target.value)} placeholder="Milestone ID" />
        <button type="button" onClick={() => void run()}>
          Run
        </button>
      </div>
      <div>Total duration: {duration}</div>
      <ol>
        {nodes.map((node) => (
          <li key={node.id}>
            {node.title} ({node.estimate_days} days)
          </li>
        ))}
      </ol>
    </section>
  );
}
