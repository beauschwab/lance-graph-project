import { Clock } from "lucide-react";
import { colors, spacing, typography, radii } from "../../theme";

type ActivityLogProps = {
	item: Record<string, unknown>;
};

function readString(item: Record<string, unknown>, key: string): string | null {
	const value = item[key];
	return typeof value === "string" && value.trim() ? value : null;
}

function formatTimestamp(value: string): string {
	try {
		const d = new Date(value);
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
	} catch {
		return value;
	}
}

export function ActivityLog({ item }: ActivityLogProps) {
	const created = readString(item, "created_at");
	const updated = readString(item, "updated_at");

	return (
		<section>
			<div
				style={{
					fontSize: typography.xs,
					fontWeight: typography.semibold,
					color: colors.textSecondary,
					textTransform: "uppercase" as const,
					letterSpacing: typography.wider,
					marginBottom: spacing.md,
				}}
			>
				Activity
			</div>
			<div style={{ display: "grid", gap: spacing.md }}>
				{created && (
					<div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
						<div
							style={{
								width: 24,
								height: 24,
								borderRadius: radii.pill,
								background: colors.statusDoneBg,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<Clock size={12} color={colors.statusDone} />
						</div>
						<div>
							<div style={{ fontSize: typography.sm, color: colors.textPrimary }}>Created</div>
							<div style={{ fontSize: typography.xs, color: colors.textTertiary }}>{formatTimestamp(created)}</div>
						</div>
					</div>
				)}
				{updated && (
					<div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
						<div
							style={{
								width: 24,
								height: 24,
								borderRadius: radii.pill,
								background: colors.statusInProgressBg,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<Clock size={12} color={colors.statusInProgress} />
						</div>
						<div>
							<div style={{ fontSize: typography.sm, color: colors.textPrimary }}>Updated</div>
							<div style={{ fontSize: typography.xs, color: colors.textTertiary }}>{formatTimestamp(updated)}</div>
						</div>
					</div>
				)}
				{!created && !updated && (
					<div style={{ fontSize: typography.sm, color: colors.textTertiary }}>
						No activity metadata available.
					</div>
				)}
			</div>
		</section>
	);
}
