import { useEffect, useState } from "react";

import { listEdges } from "../../api/edges";
import { getNode, updateNode } from "../../api/nodes";
import { ActivityLog } from "./ActivityLog";
import { DependencyList } from "./DependencyList";
import { DescriptionEditor } from "./DescriptionEditor";
import { PropertiesSidebar } from "./PropertiesSidebar";

type EdgeRecord = {
	src_id: string;
	dst_id: string;
};

type ItemDetailProps = {
	itemId: string | null;
};

export function ItemDetail({ itemId }: ItemDetailProps) {
	const [item, setItem] = useState<Record<string, unknown> | null>(null);
	const [edges, setEdges] = useState<EdgeRecord[]>([]);

	useEffect(() => {
		if (!itemId) {
			setItem(null);
			return;
		}

		async function load() {
			const [node, deps] = await Promise.all([getNode("Issue", itemId), listEdges("DEPENDS_ON") as Promise<EdgeRecord[]>]);
			setItem(node as Record<string, unknown>);
			setEdges(deps);
		}

		void load();
	}, [itemId]);

	if (!itemId) {
		return <div style={{ color: "#6b7280" }}>Select an issue to inspect details.</div>;
	}

	if (!item) {
		return <div>Loading issue details...</div>;
	}

	const description = typeof item.description === "string" ? item.description : "";
	const title = typeof item.title === "string" ? item.title : itemId;

	return (
		<div style={{ display: "grid", gap: 10 }}>
			<h3 style={{ margin: 0 }}>{title}</h3>
			<DescriptionEditor
				value={description}
				onSave={async (nextValue) => {
					await updateNode("Issue", itemId, { description: nextValue });
					setItem((prev) => (prev ? { ...prev, description: nextValue } : prev));
				}}
			/>
			<DependencyList itemId={itemId} edges={edges} />
			<ActivityLog item={item} />
			<PropertiesSidebar item={item} />
		</div>
	);
}
