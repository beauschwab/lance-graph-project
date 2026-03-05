import { useEffect, useState } from "react";

import { getHandoffHotspots } from "../../api/analysis";

type Handoff = { from_item: string; to_item: string; handoff_count: number };

export function HandoffHotspots() {
  const [rows, setRows] = useState<Handoff[]>([]);

  useEffect(() => {
    void getHandoffHotspots().then((items) => setRows(items as Handoff[]));
  }, []);

  return (
    <section>
      <h3>Handoff Hotspots</h3>
      <ul>
        {rows.map((row, idx) => (
          <li key={`${row.from_item}-${row.to_item}-${idx}`}>
            {row.from_item} {"->"} {row.to_item} ({row.handoff_count})
          </li>
        ))}
      </ul>
    </section>
  );
}
