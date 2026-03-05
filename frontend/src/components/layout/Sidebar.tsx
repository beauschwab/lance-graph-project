import { NavLink } from "react-router-dom";

const LINKS = [
	{ to: "/", label: "Table" },
	{ to: "/kanban", label: "Kanban" },
	{ to: "/gantt", label: "Gantt" },
	{ to: "/analysis/bottlenecks", label: "Bottlenecks" },
	{ to: "/analysis/critical-path", label: "Critical Path" },
	{ to: "/analysis/workload", label: "Workload" },
	{ to: "/analysis/stale-blockers", label: "Stale Blockers" },
	{ to: "/analysis/handoffs", label: "Handoffs" },
	{ to: "/analysis/impact", label: "Impact" },
	{ to: "/settings", label: "Settings" },
];

export function Sidebar() {
	return (
		<aside style={{ borderRight: "1px solid #e5e7eb", padding: 12, width: 220 }}>
			<h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Workspace</h2>
			<nav style={{ display: "grid", gap: 6 }}>
				{LINKS.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						style={({ isActive }) => ({
							textDecoration: "none",
							color: isActive ? "#111827" : "#4b5563",
							background: isActive ? "#e5edff" : "transparent",
							borderRadius: 6,
							padding: "6px 8px",
							fontWeight: isActive ? 700 : 500,
						})}
					>
						{link.label}
					</NavLink>
				))}
			</nav>
		</aside>
	);
}
