import { useEffect, useState } from "react";

import { getHandoffHotspots } from "../../api/analysis";
import { AnalysisCard, analysisHeaderCell, analysisCell } from "./AnalysisCard";
import { colors, typography, spacing } from "../../theme";

type Handoff = { from_item: string; to_item: string; handoff_count: number };

export function HandoffHotspots() {
  const [rows, setRows] = useState<Handoff[]>([]);

  useEffect(() => {
    void getHandoffHotspots().then((items) => setRows(items as Handoff[]));
  }, []);

  return (
    <AnalysisCard
      title="Handoff Hotspots"
      description="Frequent handoff points between items that may slow down delivery."
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={analysisHeaderCell}>From</th>
            <th style={analysisHeaderCell}>To</th>
            <th style={{ ...analysisHeaderCell, textAlign: "right" }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.from_item}-${row.to_item}-${idx}`}>
              <td style={{ ...analysisCell, fontFamily: typography.monoFamily, fontSize: typography.sm }}>{row.from_item}</td>
              <td style={{ ...analysisCell, fontFamily: typography.monoFamily, fontSize: typography.sm }}>{row.to_item}</td>
              <td style={{ ...analysisCell, textAlign: "right" }}>
                <span
                  style={{
                    fontWeight: typography.semibold,
                    color: colors.textSecondary,
                    background: colors.surfaceSecondary,
                    padding: `1px ${spacing.sm}px`,
                    borderRadius: 999,
                    fontSize: typography.sm,
                  }}
                >
                  {row.handoff_count}
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ ...analysisCell, textAlign: "center", color: colors.textTertiary }}>
                No handoff data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AnalysisCard>
  );
}
