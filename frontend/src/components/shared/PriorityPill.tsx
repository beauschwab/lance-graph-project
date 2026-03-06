import { getPriorityColor, getPriorityLabel } from "../../theme";
import { radii, typography, spacing } from "../../theme";

type PriorityPillProps = { value: string };

export function PriorityPill({ value }: PriorityPillProps) {
  const num = Number(value) || 3;
  const color = getPriorityColor(num);
  const label = getPriorityLabel(num);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: spacing.xs,
        fontSize: typography.xs,
        fontWeight: typography.medium,
        color,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: radii.xs,
          border: `1.5px solid ${color}`,
          fontSize: "10px",
          fontWeight: typography.bold,
          lineHeight: 1,
        }}
      >
        {num}
      </span>
      {label}
    </span>
  );
}
