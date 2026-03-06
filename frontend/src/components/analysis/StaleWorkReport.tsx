import { useEffect, useState } from "react";

import { getStaleBlockers } from "../../api/analysis";
import { AnalysisCard, analysisHeaderCell, analysisCell } from "./AnalysisCard";
import { colors, typography, spacing } from "../../theme";

type StaleEdge = { src_id: string; dst_id: string; age_days: number };

export function StaleWorkReport() {
  const [rows, setRows] = useState<StaleEdge[]>([]);

  useEffect(() => {
    void getStaleBlockers(14).then((items) => setRows(items as StaleEdge[]));
  }, []);

  return (
    <AnalysisCard
      title="Stale Blockers"
      description="Dependencies older than 14 days that may indicate stalled work."
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={analysisHeaderCell}>Source</th>
            <th style={analysisHeaderCell}>Blocked By</th>
            <th style={{ ...analysisHeaderCell, textAlign: "right" }}>Age (days)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.src_id}-${row.dst_id}-${idx}`}>
              <td style={{ ...analysisCell, fontFamily: typography.monoFamily, fontSize: typography.sm }}>{row.src_id}</td>
              <td style={{ ...analysisCell, fontFamily: typography.monoFamily, fontSize: typography.sm }}>{row.dst_id}</td>
              <td style={{ ...analysisCell, textAlign: "right" }}>
                <span
                  style={{
                    fontWeight: typography.semibold,
                    color: row.age_days >= 30 ? colors.statusBlockedText : colors.statusTodoText,
                    background: row.age_days >= 30 ? colors.statusBlockedBg : colors.statusTodoBg,
                    padding: `1px ${spacing.sm}px`,
                    borderRadius: 999,
                    fontSize: typography.sm,
                  }}
                >
                  {row.age_days}d
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ ...analysisCell, textAlign: "center", color: colors.textTertiary }}>
                No stale blockers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AnalysisCard>
  );
}
