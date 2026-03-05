type PropertiesSidebarProps = {
	item: Record<string, unknown>;
};

function field(item: Record<string, unknown>, key: string): string {
	const value = item[key];
	if (value === null || value === undefined) {
		return "-";
	}
	if (Array.isArray(value)) {
		return value.join(", ");
	}
	return String(value);
}

export function PropertiesSidebar({ item }: PropertiesSidebarProps) {
	return (
		<aside style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10 }}>
			<h4 style={{ margin: "0 0 8px" }}>Properties</h4>
			<div style={{ display: "grid", gap: 6, fontSize: 13 }}>
				<div>
					<strong>ID:</strong> {field(item, "issue_id")}
				</div>
				<div>
					<strong>Status:</strong> {field(item, "status")}
				</div>
				<div>
					<strong>Priority:</strong> {field(item, "priority")}
				</div>
				<div>
					<strong>Assignee:</strong> {field(item, "owner")}
				</div>
				<div>
					<strong>Tags:</strong> {field(item, "tags")}
				</div>
			</div>
		</aside>
	);
}
