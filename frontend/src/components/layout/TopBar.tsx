import { Command } from "lucide-react";
import { ViewSwitcher } from "../views/ViewSwitcher";
import { colors, spacing, typography, shadows, radii, layout } from "../../theme";

type ViewType = "table" | "kanban" | "gantt";

type TopBarProps = {
	title: string;
	view: ViewType;
	onViewChange: (view: ViewType) => void;
	onOpenCommandPalette: () => void;
};

export function TopBar({ title, view, onViewChange, onOpenCommandPalette }: TopBarProps) {
	return (
		<header
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				gap: spacing.lg,
				padding: `0 ${spacing.xl}px`,
				height: layout.topBarHeight,
				background: colors.surfacePrimary,
				borderBottom: `1px solid ${colors.border}`,
				flexShrink: 0,
			}}
		>
			<div>
				<h1
					style={{
						margin: 0,
						fontSize: typography.lg,
						fontWeight: typography.semibold,
						color: colors.textPrimary,
						letterSpacing: typography.tight,
					}}
				>
					{title}
				</h1>
				<div
					style={{
						color: colors.textTertiary,
						fontSize: typography.xs,
						letterSpacing: typography.wide,
						textTransform: "uppercase" as const,
					}}
				>
					Graph-backed orchestration workbench
				</div>
			</div>
			<div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
				<ViewSwitcher value={view} onChange={onViewChange} />
				<button
					type="button"
					onClick={onOpenCommandPalette}
					style={{
						display: "flex",
						alignItems: "center",
						gap: spacing.sm,
						padding: `${spacing.sm}px ${spacing.lg}px`,
						border: `1px solid ${colors.border}`,
						borderRadius: radii.md,
						background: colors.surfacePrimary,
						color: colors.textSecondary,
						fontSize: typography.sm,
						cursor: "pointer",
						boxShadow: shadows.xs,
						transition: "all 150ms ease",
					}}
				>
					<Command size={13} strokeWidth={2} />
					<span>Search</span>
					<kbd
						style={{
							padding: `0 ${spacing.xs}px`,
							borderRadius: radii.xs,
							border: `1px solid ${colors.borderLight}`,
							fontSize: typography.xs,
							fontFamily: typography.monoFamily,
							color: colors.textTertiary,
							marginLeft: spacing.xs,
							background: colors.surfaceSecondary,
						}}
					>
						⌘K
					</kbd>
				</button>
			</div>
		</header>
	);
}
