type ViewType = "table" | "kanban" | "gantt";

type ViewSwitcherProps = {
	value: ViewType;
	onChange: (view: ViewType) => void;
};

const VIEWS: Array<{ id: ViewType; label: string }> = [
	{ id: "table", label: "Table" },
	{ id: "kanban", label: "Kanban" },
	{ id: "gantt", label: "Gantt" },
];

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
	return (
		<div style={{ display: "inline-flex", border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden" }}>
			{VIEWS.map((view) => {
				const active = value === view.id;
				return (
					<button
						key={view.id}
						type="button"
						onClick={() => onChange(view.id)}
						style={{
							border: 0,
							borderRight: view.id === "gantt" ? 0 : "1px solid #d1d5db",
							background: active ? "#111827" : "#ffffff",
							color: active ? "#ffffff" : "#111827",
							padding: "6px 10px",
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						{view.label}
					</button>
				);
			})}
		</div>
	);
}
