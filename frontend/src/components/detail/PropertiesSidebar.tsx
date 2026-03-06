import { StatusBadge } from "../shared/StatusBadge";
import { PriorityPill } from "../shared/PriorityPill";
import { AssigneeAvatar } from "../shared/AssigneeAvatar";
import { colors, spacing, radii, typography } from "../../theme";

type PropertiesSidebarProps = {
	item: Record<string, unknown>;
};

function field(item: Record<string, unknown>, key: string): string {
	const value = item[key];
	if (value === null || value === undefined) {
		return "-";
	}
	if (Array.isArray(value)) {
		return value.join(", ");
	}
	return String(value);
}

export function PropertiesSidebar({ item }: PropertiesSidebarProps) {
	const status = field(item, "status");
	const priority = field(item, "priority");
	const owner = field(item, "owner");
	const tags = field(item, "tags");

	return (
		<aside
			style={{
				border: `1px solid ${colors.border}`,
				borderRadius: radii.lg,
				overflow: "hidden",
			}}
		>
			<div
				style={{
					padding: `${spacing.md}px ${spacing.lg}px`,
					background: colors.surfaceSecondary,
					borderBottom: `1px solid ${colors.borderLight}`,
					fontSize: typography.xs,
					fontWeight: typography.semibold,
					color: colors.textSecondary,
					textTransform: "uppercase" as const,
					letterSpacing: typography.wider,
				}}
			>
				Properties
			</div>
			<div style={{ padding: spacing.lg, display: "grid", gap: spacing.lg }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ fontSize: typography.sm, color: colors.textTertiary }}>Status</span>
					<StatusBadge value={status} />
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ fontSize: typography.sm, color: colors.textTertiary }}>Priority</span>
					<PriorityPill value={priority} />
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ fontSize: typography.sm, color: colors.textTertiary }}>Assignee</span>
					<AssigneeAvatar name={owner} />
				</div>
				{tags && tags !== "-" && (
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
						<span style={{ fontSize: typography.sm, color: colors.textTertiary }}>Tags</span>
						<div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap", justifyContent: "flex-end" }}>
							{tags.split(", ").map((tag) => (
								<span
									key={tag}
									style={{
										fontSize: typography.xs,
										padding: `1px ${spacing.sm}px`,
										borderRadius: radii.pill,
										background: colors.surfaceSecondary,
										border: `1px solid ${colors.borderLight}`,
										color: colors.textSecondary,
									}}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				)}
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<span style={{ fontSize: typography.sm, color: colors.textTertiary }}>ID</span>
					<span style={{ fontSize: typography.xs, fontFamily: typography.monoFamily, color: colors.textTertiary }}>
						{field(item, "issue_id")}
					</span>
				</div>
			</div>
		</aside>
	);
}
