import { useEffect, useState } from "react";

import { getStaleBlockers } from "../../api/analysis";

type StaleEdge = { src_id: string; dst_id: string; age_days: number };

export function StaleWorkReport() {
  const [rows, setRows] = useState<StaleEdge[]>([]);

  useEffect(() => {
    void getStaleBlockers(14).then((items) => setRows(items as StaleEdge[]));
  }, []);

  return (
    <section>
      <h3>Stale Blockers</h3>
      <ul>
        {rows.map((row, idx) => (
          <li key={`${row.src_id}-${row.dst_id}-${idx}`}>
            {row.src_id} blocked by {row.dst_id} ({row.age_days} days)
          </li>
        ))}
      </ul>
    </section>
  );
}
