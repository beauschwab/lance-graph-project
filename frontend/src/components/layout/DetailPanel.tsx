import { ItemDetail } from "../detail/ItemDetail";

type DetailPanelProps = {
	selectedId: string | null;
};

export function DetailPanel({ selectedId }: DetailPanelProps) {
	return (
		<section style={{ borderLeft: "1px solid #e5e7eb", width: 340, padding: 12, overflowY: "auto" }}>
			<ItemDetail itemId={selectedId} />
		</section>
	);
}
