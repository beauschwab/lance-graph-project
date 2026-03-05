import { ViewSwitcher } from "../views/ViewSwitcher";

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
				gap: 12,
				padding: 12,
				borderBottom: "1px solid #e5e7eb",
			}}
		>
			<div>
				<h1 style={{ margin: 0, fontSize: 18 }}>{title}</h1>
				<div style={{ color: "#6b7280", fontSize: 12 }}>Graph-backed orchestration workbench</div>
			</div>
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<ViewSwitcher value={view} onChange={onViewChange} />
				<button type="button" onClick={onOpenCommandPalette}>
					Command Palette
				</button>
			</div>
		</header>
	);
}
