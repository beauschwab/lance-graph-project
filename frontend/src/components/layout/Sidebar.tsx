import { NavLink } from "react-router-dom";
import {
	Table2,
	Columns3,
	GanttChart,
	AlertTriangle,
	Route,
	Users,
	Clock,
	ArrowLeftRight,
	Zap,
	Settings,
	Hexagon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors, spacing, radii, typography, layout } from "../../theme";

type NavSection = {
	title: string;
	links: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }>;
};

const NAV_SECTIONS: NavSection[] = [
	{
		title: "Views",
		links: [
			{ to: "/", label: "Table", icon: Table2, end: true },
			{ to: "/kanban", label: "Kanban", icon: Columns3 },
			{ to: "/gantt", label: "Gantt", icon: GanttChart },
		],
	},
	{
		title: "Analysis",
		links: [
			{ to: "/analysis/bottlenecks", label: "Bottlenecks", icon: AlertTriangle },
			{ to: "/analysis/critical-path", label: "Critical Path", icon: Route },
			{ to: "/analysis/workload", label: "Workload", icon: Users },
			{ to: "/analysis/stale-blockers", label: "Stale Blockers", icon: Clock },
			{ to: "/analysis/handoffs", label: "Handoffs", icon: ArrowLeftRight },
			{ to: "/analysis/impact", label: "Impact", icon: Zap },
		],
	},
	{
		title: "System",
		links: [{ to: "/settings", label: "Settings", icon: Settings }],
	},
];

export function Sidebar() {
	return (
		<aside
			className="sidebar-scroll"
			style={{
				width: layout.sidebarWidth,
				background: colors.sidebarBg,
				display: "flex",
				flexDirection: "column",
				overflowY: "auto",
				borderRight: `1px solid ${colors.sidebarBorder}`,
			}}
		>
			{/* Logo / brand */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: spacing.md,
					padding: `${spacing.xl}px ${spacing.xl}px ${spacing.lg}px`,
					borderBottom: `1px solid ${colors.sidebarBorder}`,
				}}
			>
				<div
					style={{
						width: 28,
						height: 28,
						borderRadius: radii.md,
						background: `linear-gradient(135deg, ${colors.primary}, #818cf8)`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					<Hexagon size={16} color="#fff" strokeWidth={2.5} />
				</div>
				<div>
					<div
						style={{
							fontSize: typography.md,
							fontWeight: typography.semibold,
							color: colors.sidebarTextActive,
							letterSpacing: typography.tight,
							lineHeight: 1,
						}}
					>
						Orchestrate
					</div>
					<div
						style={{
							fontSize: typography.xs,
							color: colors.sidebarText,
							marginTop: 2,
							letterSpacing: typography.wide,
							textTransform: "uppercase" as const,
						}}
					>
						Workspace
					</div>
				</div>
			</div>

			{/* Navigation */}
			<nav style={{ flex: 1, padding: `${spacing.lg}px ${spacing.md}px` }}>
				{NAV_SECTIONS.map((section) => (
					<div key={section.title} style={{ marginBottom: spacing.xl }}>
						<div
							style={{
								fontSize: typography.xs,
								fontWeight: typography.medium,
								color: colors.sidebarText,
								textTransform: "uppercase" as const,
								letterSpacing: typography.widest,
								padding: `${spacing.xs}px ${spacing.md}px`,
								marginBottom: spacing.xxs,
							}}
						>
							{section.title}
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
							{section.links.map((link) => {
								const Icon = link.icon;
								return (
									<NavLink
										key={link.to}
										to={link.to}
										end={link.end}
										style={({ isActive }) => ({
											display: "flex",
											alignItems: "center",
											gap: spacing.md,
											padding: `${spacing.sm}px ${spacing.md}px`,
											borderRadius: radii.md,
											fontSize: typography.base,
											fontWeight: isActive ? typography.medium : typography.normal,
											color: isActive ? colors.sidebarTextActive : colors.sidebarText,
											background: isActive ? colors.sidebarBgActive : "transparent",
											transition: "all 150ms ease",
											cursor: "pointer",
										})}
									>
										<Icon
											size={16}
											strokeWidth={1.75}
											style={{ flexShrink: 0, opacity: 0.85 }}
										/>
										{link.label}
									</NavLink>
								);
							})}
						</div>
					</div>
				))}
			</nav>

			{/* Keyboard hint */}
			<div
				style={{
					padding: `${spacing.lg}px ${spacing.xl}px`,
					borderTop: `1px solid ${colors.sidebarBorder}`,
					display: "flex",
					alignItems: "center",
					gap: spacing.sm,
					fontSize: typography.xs,
					color: colors.sidebarText,
				}}
			>
				<kbd
					style={{
						padding: `1px ${spacing.xs}px`,
						borderRadius: radii.xs,
						border: `1px solid ${colors.sidebarBorder}`,
						fontSize: typography.xs,
						fontFamily: typography.monoFamily,
						color: colors.sidebarText,
						background: "rgba(255,255,255,0.05)",
					}}
				>
					⌘K
				</kbd>
				<span>Command palette</span>
			</div>
		</aside>
	);
}
