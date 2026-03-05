import { useEffect, useState } from "react";

import { getBottlenecks } from "../../api/analysis";

type Bottleneck = { item_id: string; title: string; fan_in: number };

export function BottleneckReport() {
  const [items, setItems] = useState<Bottleneck[]>([]);

  useEffect(() => {
    void getBottlenecks().then((rows) => setItems(rows as Bottleneck[]));
  }, []);

  return (
    <section>
      <h3>Bottlenecks</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Fan-in</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.item_id}>
              <td>{row.title}</td>
              <td>{row.fan_in}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
