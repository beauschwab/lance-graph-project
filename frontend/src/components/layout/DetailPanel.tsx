import { ItemDetail } from "../detail/ItemDetail";
import { colors, spacing, layout, typography } from "../../theme";

type DetailPanelProps = {
	selectedId: string | null;
};

export function DetailPanel({ selectedId }: DetailPanelProps) {
	return (
		<section
			style={{
				borderLeft: `1px solid ${colors.border}`,
				width: layout.detailPanelWidth,
				padding: spacing.xl,
				overflowY: "auto",
				background: colors.surfacePrimary,
			}}
		>
			{selectedId ? (
				<ItemDetail itemId={selectedId} />
			) : (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						textAlign: "center",
						padding: spacing.xxl,
					}}
				>
					<div
						style={{
							width: 48,
							height: 48,
							borderRadius: 12,
							background: colors.surfaceSecondary,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							marginBottom: spacing.lg,
							fontSize: 20,
						}}
					>
						📋
					</div>
					<div
						style={{
							fontSize: typography.md,
							fontWeight: typography.medium,
							color: colors.textSecondary,
							marginBottom: spacing.xs,
						}}
					>
						No item selected
					</div>
					<div style={{ fontSize: typography.sm, color: colors.textTertiary }}>
						Click on an issue to view its details, dependencies, and activity.
					</div>
				</div>
			)}
		</section>
	);
}
