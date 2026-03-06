import { useState } from "react";
import { Zap } from "lucide-react";

import { runImpactAnalysis } from "../../api/analysis";
import { AnalysisCard, analysisInput, analysisButton } from "./AnalysisCard";
import { colors, spacing, radii, typography } from "../../theme";

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
    <AnalysisCard
      title="Impact Analysis"
      description="Simulate a delay on an item and see which downstream items are affected."
    >
      <div style={{ padding: spacing.xl }}>
        <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.xl, alignItems: "center" }}>
          <input
            value={itemId}
            onChange={(event) => setItemId(event.target.value)}
            placeholder="Item ID"
            style={analysisInput}
          />
          <input
            type="number"
            value={slipDays}
            onChange={(event) => setSlipDays(Number(event.target.value || 0))}
            style={{ ...analysisInput, width: 100 }}
          />
          <button
            type="button"
            onClick={() => void run()}
            style={{ ...analysisButton, display: "flex", alignItems: "center", gap: spacing.xs }}
          >
            <Zap size={13} />
            Analyze
          </button>
        </div>

        {result && (
          <div className="animate-fadeInUp">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: spacing.sm,
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: radii.md,
                background: colors.statusBlockedBg,
                color: colors.statusBlockedText,
                fontSize: typography.sm,
                fontWeight: typography.semibold,
                marginBottom: spacing.xl,
              }}
            >
              {result.item_id} slipping {result.slip_days} days → {result.impacted_item_ids.length} items affected
            </div>

            {result.impacted_item_ids.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
                {result.impacted_item_ids.map((id) => (
                  <span
                    key={id}
                    style={{
                      fontSize: typography.xs,
                      fontFamily: typography.monoFamily,
                      padding: `2px ${spacing.md}px`,
                      borderRadius: radii.sm,
                      border: `1px solid ${colors.border}`,
                      background: colors.surfaceSecondary,
                      color: colors.textSecondary,
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AnalysisCard>
  );
}
