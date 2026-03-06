import { useEffect, useState } from "react";

import { getBottlenecks } from "../../api/analysis";
import { AnalysisCard, analysisHeaderCell, analysisCell } from "./AnalysisCard";
import { colors, typography, spacing } from "../../theme";

type Bottleneck = { item_id: string; title: string; fan_in: number };

export function BottleneckReport() {
  const [items, setItems] = useState<Bottleneck[]>([]);

  useEffect(() => {
    void getBottlenecks().then((rows) => setItems(rows as Bottleneck[]));
  }, []);

  return (
    <AnalysisCard
      title="Bottleneck Analysis"
      description="Items with the highest number of incoming dependencies — potential single points of failure."
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={analysisHeaderCell}>Item</th>
            <th style={{ ...analysisHeaderCell, width: 100, textAlign: "right" }}>Fan-in</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.item_id}>
              <td style={analysisCell}>
                <div style={{ fontWeight: typography.medium }}>{row.title}</div>
                <div style={{ fontSize: typography.xs, color: colors.textTertiary, fontFamily: typography.monoFamily }}>
                  {row.item_id}
                </div>
              </td>
              <td style={{ ...analysisCell, textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 28,
                    height: 22,
                    borderRadius: 999,
                    background: row.fan_in >= 3 ? colors.statusBlockedBg : colors.surfaceSecondary,
                    color: row.fan_in >= 3 ? colors.statusBlockedText : colors.textSecondary,
                    fontSize: typography.sm,
                    fontWeight: typography.semibold,
                    padding: `0 ${spacing.sm}px`,
                  }}
                >
                  {row.fan_in}
                </span>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={2} style={{ ...analysisCell, textAlign: "center", color: colors.textTertiary }}>
                No bottlenecks detected.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AnalysisCard>
  );
}
