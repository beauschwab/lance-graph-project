import { useEffect, useState } from "react";

import { listStatuses } from "../../api/settings";

type StatusItem = { status_id: string; name: string; category: string; sort_order?: number };

export function StatusSettings() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);

  useEffect(() => {
    void listStatuses().then((rows) => setStatuses(rows as StatusItem[]));
  }, []);

  return (
    <section>
      <h3>Statuses</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Order</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((status) => (
            <tr key={status.status_id}>
              <td>{status.name}</td>
              <td>{status.category}</td>
              <td>{status.sort_order ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
