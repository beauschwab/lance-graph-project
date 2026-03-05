import { useMemo, useState } from "react";

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
				background: "rgba(0,0,0,0.35)",
				display: "grid",
				placeItems: "start center",
				paddingTop: "10vh",
				zIndex: 100,
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				onClick={(event) => event.stopPropagation()}
				style={{ width: "min(640px, 90vw)", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb" }}
			>
				<input
					autoFocus
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Type a command"
					style={{ width: "100%", padding: 12, border: 0, borderBottom: "1px solid #e5e7eb", fontSize: 14 }}
				/>
				<div style={{ maxHeight: 280, overflowY: "auto", padding: 8, display: "grid", gap: 4 }}>
					{filtered.map((command) => (
						<button
							key={command.id}
							type="button"
							onClick={() => {
								command.action();
								setQuery("");
								onClose();
							}}
							style={{ textAlign: "left", border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", background: "#fff" }}
						>
							{command.label}
						</button>
					))}
					{filtered.length === 0 ? <div style={{ color: "#6b7280", padding: 8 }}>No commands found.</div> : null}
				</div>
			</div>
		</div>
	);
}
