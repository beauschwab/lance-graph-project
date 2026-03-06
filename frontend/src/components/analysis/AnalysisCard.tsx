import type { ReactNode } from "react";
import { colors, spacing, radii, typography, shadows } from "../../theme";

type AnalysisCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AnalysisCard({ title, description, children }: AnalysisCardProps) {
  return (
    <section className="animate-fadeInUp">
      <div style={{ marginBottom: spacing.xl }}>
        <h3
          style={{
            margin: 0,
            fontSize: typography.xl,
            fontWeight: typography.semibold,
            color: colors.textPrimary,
            letterSpacing: typography.tight,
          }}
        >
          {title}
        </h3>
        {description && (
          <p style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.sm, color: colors.textTertiary }}>
            {description}
          </p>
        )}
      </div>
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: radii.lg,
          overflow: "hidden",
          background: colors.surfacePrimary,
          boxShadow: shadows.sm,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* Reusable styled table helpers */

export const analysisHeaderCell: React.CSSProperties = {
  padding: `${spacing.md}px ${spacing.xl}px`,
  fontSize: typography.xs,
  fontWeight: typography.medium,
  color: colors.textTertiary,
  textTransform: "uppercase",
  letterSpacing: typography.wider,
  background: colors.surfaceSecondary,
  borderBottom: `1px solid ${colors.border}`,
  textAlign: "left",
};

export const analysisCell: React.CSSProperties = {
  padding: `${spacing.md}px ${spacing.xl}px`,
  fontSize: typography.base,
  color: colors.textPrimary,
  borderBottom: `1px solid ${colors.borderLight}`,
};

export const analysisInput: React.CSSProperties = {
  padding: `${spacing.sm}px ${spacing.lg}px`,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  fontSize: typography.base,
  color: colors.textPrimary,
  background: colors.surfacePrimary,
  outline: "none",
};

export const analysisButton: React.CSSProperties = {
  padding: `${spacing.sm}px ${spacing.xl}px`,
  border: "none",
  borderRadius: radii.md,
  background: colors.primary,
  color: colors.primaryText,
  fontSize: typography.sm,
  fontWeight: typography.medium,
  cursor: "pointer",
  boxShadow: shadows.sm,
};
