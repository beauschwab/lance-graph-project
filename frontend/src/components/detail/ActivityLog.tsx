type ActivityLogProps = {
	item: Record<string, unknown>;
};

function readString(item: Record<string, unknown>, key: string): string | null {
	const value = item[key];
	return typeof value === "string" && value.trim() ? value : null;
}

export function ActivityLog({ item }: ActivityLogProps) {
	const created = readString(item, "created_at");
	const updated = readString(item, "updated_at");

	return (
		<section>
			<h4 style={{ margin: "0 0 8px" }}>Activity</h4>
			<ul style={{ margin: 0, paddingLeft: 18 }}>
				{created ? <li>Created: {created}</li> : null}
				{updated ? <li>Updated: {updated}</li> : null}
				{!created && !updated ? <li>No activity metadata available.</li> : null}
			</ul>
		</section>
	);
}
