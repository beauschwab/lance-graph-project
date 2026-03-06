import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { colors, spacing, radii, typography, shadows } from "../../theme";

export type CommandItem = {
	id: string;
	label: string;
	action: () => void;
};

type CommandPaletteProps = {
	open: boolean;
	commands: CommandItem[];
	onClose: () => void;
};

export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		if (!query.trim()) {
			return commands;
		}
		const q = query.toLowerCase();
		return commands.filter((command) => command.label.toLowerCase().includes(q));
	}, [commands, query]);

	if (!open) {
		return null;
	}

	return (
		<div
			role="presentation"
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: colors.overlay,
				backdropFilter: "blur(4px)",
				display: "grid",
				placeItems: "start center",
				paddingTop: "12vh",
				zIndex: 100,
			}}
			className="animate-fadeIn"
		>
			<div
				role="dialog"
				aria-modal="true"
				onClick={(event) => event.stopPropagation()}
				className="animate-scaleIn"
				style={{
					width: "min(560px, 90vw)",
					background: colors.surfacePrimary,
					borderRadius: radii.xxl,
					border: `1px solid ${colors.border}`,
					boxShadow: shadows.xl,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: spacing.md,
						padding: `0 ${spacing.xl}px`,
						borderBottom: `1px solid ${colors.borderLight}`,
					}}
				>
					<Search size={16} color={colors.textTertiary} />
					<input
						autoFocus
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Type a command..."
						style={{
							flex: 1,
							padding: `${spacing.xl}px 0`,
							border: "none",
							fontSize: typography.md,
							color: colors.textPrimary,
							background: "transparent",
							outline: "none",
						}}
					/>
					<kbd
						style={{
							padding: `2px ${spacing.sm}px`,
							borderRadius: radii.xs,
							border: `1px solid ${colors.borderLight}`,
							fontSize: typography.xs,
							fontFamily: typography.monoFamily,
							color: colors.textTertiary,
							background: colors.surfaceSecondary,
						}}
					>
						Esc
					</kbd>
				</div>
				<div style={{ maxHeight: 320, overflowY: "auto", padding: spacing.sm }}>
					{filtered.map((command) => (
						<button
							key={command.id}
							type="button"
							onClick={() => {
								command.action();
								setQuery("");
								onClose();
							}}
							style={{
								display: "block",
								width: "100%",
								textAlign: "left",
								border: "none",
								borderRadius: radii.md,
								padding: `${spacing.md}px ${spacing.lg}px`,
								background: "transparent",
								color: colors.textPrimary,
								fontSize: typography.base,
								cursor: "pointer",
								transition: "background 100ms ease",
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = colors.surfaceHover;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = "transparent";
							}}
						>
							{command.label}
						</button>
					))}
					{filtered.length === 0 ? (
						<div style={{ color: colors.textTertiary, padding: `${spacing.xl}px ${spacing.lg}px`, textAlign: "center", fontSize: typography.sm }}>
							No commands found.
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
