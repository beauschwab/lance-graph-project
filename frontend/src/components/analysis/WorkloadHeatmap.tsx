import { useEffect, useState } from "react";

import { getTeamWorkload } from "../../api/analysis";
import { AnalysisCard, analysisHeaderCell, analysisCell } from "./AnalysisCard";
import { colors, spacing, typography } from "../../theme";

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
    <AnalysisCard
      title="Team Workload"
      description="Estimated workload distribution and blocked-item counts per team."
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={analysisHeaderCell}>Team</th>
            <th style={{ ...analysisHeaderCell, textAlign: "right" }}>Estimate (days)</th>
            <th style={{ ...analysisHeaderCell, textAlign: "right" }}>Items</th>
            <th style={{ ...analysisHeaderCell, textAlign: "right" }}>Blocked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team_id}>
              <td style={{ ...analysisCell, fontWeight: typography.medium }}>{row.team_id}</td>
              <td style={{ ...analysisCell, textAlign: "right", fontFamily: typography.monoFamily }}>
                {row.total_estimate_days}
              </td>
              <td style={{ ...analysisCell, textAlign: "right", fontFamily: typography.monoFamily }}>
                {row.item_count}
              </td>
              <td style={{ ...analysisCell, textAlign: "right" }}>
                <span
                  style={{
                    fontFamily: typography.monoFamily,
                    color: row.blocked_count > 0 ? colors.statusBlockedText : colors.textTertiary,
                    fontWeight: row.blocked_count > 0 ? typography.semibold : typography.normal,
                  }}
                >
                  {row.blocked_count}
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ ...analysisCell, textAlign: "center", color: colors.textTertiary }}>
                No workload data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </AnalysisCard>
  );
}
