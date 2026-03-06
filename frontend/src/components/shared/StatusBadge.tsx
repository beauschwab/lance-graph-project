import { getStatusStyle } from "../../theme";
import { radii, typography, spacing } from "../../theme";

type StatusBadgeProps = { value: string };

export function StatusBadge({ value }: StatusBadgeProps) {
  const status = getStatusStyle(value);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: spacing.xs,
        padding: `2px ${spacing.md}px`,
        borderRadius: radii.pill,
        fontSize: typography.xs,
        fontWeight: typography.medium,
        letterSpacing: typography.wide,
        color: status.textColor,
        background: status.bg,
        lineHeight: "18px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: status.color,
          flexShrink: 0,
        }}
      />
      {status.label}
    </span>
  );
}
