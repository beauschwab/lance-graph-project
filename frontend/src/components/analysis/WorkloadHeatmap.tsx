import { useEffect, useState } from "react";

import { getTeamWorkload } from "../../api/analysis";

type Workload = {
  team_id: string;
  total_estimate_days: number;
  item_count: number;
  blocked_count: number;
};

export function WorkloadHeatmap() {
  const [rows, setRows] = useState<Workload[]>([]);

  useEffect(() => {
    void getTeamWorkload().then((items) => setRows(items as Workload[]));
  }, []);

  return (
    <section>
      <h3>Team Workload</h3>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Total Estimate</th>
            <th>Items</th>
            <th>Blocked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team_id}>
              <td>{row.team_id}</td>
              <td>{row.total_estimate_days}</td>
              <td>{row.item_count}</td>
              <td>{row.blocked_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
