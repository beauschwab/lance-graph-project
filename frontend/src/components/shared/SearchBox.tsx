import { Search } from "lucide-react";
import { colors, spacing, radii, typography, shadows } from "../../theme";

type SearchBoxProps = { query: string; onChange: (value: string) => void };

export function SearchBox({ query, onChange }: SearchBoxProps) {
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
        boxShadow: shadows.xs,
      }}
    >
      <Search size={14} color={colors.textTertiary} />
      <input
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search..."
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          fontSize: typography.base,
          color: colors.textPrimary,
          outline: "none",
        }}
      />
    </div>
  );
}
