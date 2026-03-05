type EdgeRecord = {
	src_id: string;
	dst_id: string;
};

type DependencyListProps = {
	itemId: string;
	edges: EdgeRecord[];
};

export function DependencyList({ itemId, edges }: DependencyListProps) {
	const blocks = edges.filter((edge) => edge.src_id === itemId).map((edge) => edge.dst_id);
	const blockedBy = edges.filter((edge) => edge.dst_id === itemId).map((edge) => edge.src_id);

	return (
		<section>
			<h4 style={{ margin: "0 0 8px" }}>Dependencies</h4>
			<div style={{ display: "grid", gap: 6 }}>
				<div>
					<strong>Blocks:</strong> {blocks.length ? blocks.join(", ") : "None"}
				</div>
				<div>
					<strong>Blocked by:</strong> {blockedBy.length ? blockedBy.join(", ") : "None"}
				</div>
			</div>
		</section>
	);
}
