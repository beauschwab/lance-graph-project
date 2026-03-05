import { useEffect, useState } from "react";

import { listPriorities } from "../../api/settings";

type PriorityItem = { priority_id: string; name: string; level: number };

export function PrioritySettings() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);

  useEffect(() => {
    void listPriorities().then((rows) => setPriorities(rows as PriorityItem[]));
  }, []);

  return (
    <section>
      <h3>Priorities</h3>
      <ul>
        {priorities.map((priority) => (
          <li key={priority.priority_id}>
            {priority.level}: {priority.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
