import { useState } from "react";
import { Play } from "lucide-react";

import { getCriticalPath } from "../../api/analysis";
import { AnalysisCard, analysisInput, analysisButton } from "./AnalysisCard";
import { colors, spacing, radii, typography, shadows } from "../../theme";

type PathNode = { id: string; title: string; estimate_days: number };

export function CriticalPathView() {
  const [milestoneId, setMilestoneId] = useState("MS-1");
  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [duration, setDuration] = useState(0);

  async function run() {
    const result = await getCriticalPath(milestoneId);
    setNodes(result.path ?? []);
    setDuration(result.total_duration_days ?? 0);
  }

  return (
    <AnalysisCard
      title="Critical Path"
      description="The longest sequence of dependent tasks that determines the minimum project duration."
    >
      <div style={{ padding: spacing.xl }}>
        <div style={{ display: "flex", gap: spacing.md, marginBottom: spacing.xl, alignItems: "center" }}>
          <input
            value={milestoneId}
            onChange={(event) => setMilestoneId(event.target.value)}
            placeholder="Milestone ID"
            style={analysisInput}
          />
          <button
            type="button"
            onClick={() => void run()}
            style={{ ...analysisButton, display: "flex", alignItems: "center", gap: spacing.xs }}
          >
            <Play size={13} />
            Run
          </button>
        </div>

        {duration > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: spacing.sm,
              padding: `${spacing.sm}px ${spacing.lg}px`,
              borderRadius: radii.md,
              background: colors.primaryLight,
              color: colors.primary,
              fontSize: typography.sm,
              fontWeight: typography.semibold,
              marginBottom: spacing.xl,
            }}
          >
            Total duration: {duration} days
          </div>
        )}

        {nodes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {nodes.map((node, i) => (
              <div
                key={node.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.lg,
                  padding: spacing.lg,
                  border: `1px solid ${colors.borderLight}`,
                  borderRadius: radii.md,
                  background: colors.surfacePrimary,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: radii.pill,
                    background: colors.primary,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: typography.xs,
                    fontWeight: typography.bold,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: typography.medium, color: colors.textPrimary }}>{node.title}</div>
                  <div style={{ fontSize: typography.xs, color: colors.textTertiary, fontFamily: typography.monoFamily }}>
                    {node.id}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: typography.sm,
                    fontWeight: typography.semibold,
                    color: colors.textSecondary,
                    background: colors.surfaceSecondary,
                    padding: `${spacing.xxs}px ${spacing.md}px`,
                    borderRadius: radii.sm,
                  }}
                >
                  {node.estimate_days}d
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnalysisCard>
  );
}
