import { Filter } from "lucide-react";
import { colors, spacing, radii, typography } from "../../theme";

export function FilterBar() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.sm,
        padding: `${spacing.sm}px ${spacing.lg}px`,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.md,
        background: colors.surfacePrimary,
        color: colors.textTertiary,
        fontSize: typography.sm,
        cursor: "pointer",
      }}
    >
      <Filter size={13} />
      <span>Filter</span>
    </div>
  );
}
