import { useState } from "react";

import { runImpactAnalysis } from "../../api/analysis";

type Impact = { item_id: string; slip_days: number; impacted_item_ids: string[] };

export function ImpactAnalysis() {
  const [itemId, setItemId] = useState("");
  const [slipDays, setSlipDays] = useState(3);
  const [result, setResult] = useState<Impact | null>(null);

  async function run() {
    const payload = await runImpactAnalysis(itemId, slipDays);
    setResult(payload as Impact);
  }

  return (
    <section>
      <h3>Impact Analysis</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={itemId} onChange={(event) => setItemId(event.target.value)} placeholder="Item ID" />
        <input
          type="number"
          value={slipDays}
          onChange={(event) => setSlipDays(Number(event.target.value || 0))}
          style={{ width: 90 }}
        />
        <button type="button" onClick={() => void run()}>
          Analyze
        </button>
      </div>

      {result ? (
        <div>
          <p>
            {result.item_id} slip {result.slip_days} days
          </p>
          <ul>
            {result.impacted_item_ids.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
