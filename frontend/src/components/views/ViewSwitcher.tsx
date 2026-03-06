import { Table2, Columns3, GanttChart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors, spacing, radii, typography, shadows } from "../../theme";

type ViewType = "table" | "kanban" | "gantt";

type ViewSwitcherProps = {
	value: ViewType;
	onChange: (view: ViewType) => void;
};

const VIEWS: Array<{ id: ViewType; label: string; icon: LucideIcon }> = [
	{ id: "table", label: "Table", icon: Table2 },
	{ id: "kanban", label: "Kanban", icon: Columns3 },
	{ id: "gantt", label: "Gantt", icon: GanttChart },
];

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
	return (
		<div
			style={{
				display: "inline-flex",
				background: colors.surfaceSecondary,
				borderRadius: radii.lg,
				padding: 2,
				border: `1px solid ${colors.border}`,
			}}
		>
			{VIEWS.map((view) => {
				const active = value === view.id;
				const Icon = view.icon;
				return (
					<button
						key={view.id}
						type="button"
						onClick={() => onChange(view.id)}
						style={{
							display: "flex",
							alignItems: "center",
							gap: spacing.xs,
							border: "none",
							borderRadius: radii.md,
							background: active ? colors.surfacePrimary : "transparent",
							color: active ? colors.textPrimary : colors.textSecondary,
							padding: `${spacing.xs}px ${spacing.lg}px`,
							fontWeight: active ? typography.medium : typography.normal,
							fontSize: typography.sm,
							cursor: "pointer",
							boxShadow: active ? shadows.xs : "none",
							transition: "all 150ms ease",
						}}
					>
						<Icon size={14} strokeWidth={active ? 2 : 1.5} />
						{view.label}
					</button>
				);
			})}
		</div>
	);
}
