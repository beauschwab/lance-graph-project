import { ArrowRight, ArrowLeft } from "lucide-react";
import { colors, spacing, radii, typography } from "../../theme";

type EdgeRecord = {
	src_id: string;
	dst_id: string;
};

type DependencyListProps = {
	itemId: string;
	edges: EdgeRecord[];
};

export function DependencyList({ itemId, edges }: DependencyListProps) {
	const blocks = edges.filter((edge) => edge.src_id === itemId).map((edge) => edge.dst_id);
	const blockedBy = edges.filter((edge) => edge.dst_id === itemId).map((edge) => edge.src_id);

	if (blocks.length === 0 && blockedBy.length === 0) {
		return null;
	}

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
				Dependencies
			</div>
			<div style={{ display: "grid", gap: spacing.md }}>
				{blocks.length > 0 && (
					<div>
						<div style={{ display: "flex", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs }}>
							<ArrowRight size={12} color={colors.statusBlocked} />
							<span style={{ fontSize: typography.xs, fontWeight: typography.medium, color: colors.statusBlockedText }}>
								Blocks ({blocks.length})
							</span>
						</div>
						<div style={{ display: "flex", flexWrap: "wrap", gap: spacing.xs }}>
							{blocks.map((id) => (
								<span
									key={id}
									style={{
										fontSize: typography.xs,
										fontFamily: typography.monoFamily,
										padding: `1px ${spacing.sm}px`,
										borderRadius: radii.sm,
										background: colors.statusBlockedBg,
										color: colors.statusBlockedText,
										border: `1px solid rgba(239,68,68,0.2)`,
									}}
								>
									{id}
								</span>
							))}
						</div>
					</div>
				)}
				{blockedBy.length > 0 && (
					<div>
						<div style={{ display: "flex", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs }}>
							<ArrowLeft size={12} color={colors.statusTodo} />
							<span style={{ fontSize: typography.xs, fontWeight: typography.medium, color: colors.statusTodoText }}>
								Blocked by ({blockedBy.length})
							</span>
						</div>
						<div style={{ display: "flex", flexWrap: "wrap", gap: spacing.xs }}>
							{blockedBy.map((id) => (
								<span
									key={id}
									style={{
										fontSize: typography.xs,
										fontFamily: typography.monoFamily,
										padding: `1px ${spacing.sm}px`,
										borderRadius: radii.sm,
										background: colors.statusTodoBg,
										color: colors.statusTodoText,
										border: `1px solid rgba(245,158,11,0.2)`,
									}}
								>
									{id}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
