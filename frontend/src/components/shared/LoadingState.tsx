import { Loader2 } from "lucide-react";
import { colors, typography, spacing } from "../../theme";

export function LoadingState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.huge,
        gap: spacing.lg,
      }}
    >
      <Loader2
        className="animate-spin"
        size={24}
        color={colors.primary}
        strokeWidth={2}
      />
      <span style={{ fontSize: typography.sm, color: colors.textTertiary }}>
        Loading...
      </span>
    </div>
  );
}
