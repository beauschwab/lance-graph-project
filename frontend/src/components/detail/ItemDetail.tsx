import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { listEdges } from "../../api/edges";
import { getNode, updateNode } from "../../api/nodes";
import { ActivityLog } from "./ActivityLog";
import { DependencyList } from "./DependencyList";
import { DescriptionEditor } from "./DescriptionEditor";
import { PropertiesSidebar } from "./PropertiesSidebar";
import { colors, spacing, typography, radii } from "../../theme";

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
			const [node, deps] = await Promise.all([getNode("Issue", itemId!), listEdges("DEPENDS_ON") as Promise<EdgeRecord[]>]);
			setItem(node as Record<string, unknown>);
			setEdges(deps);
		}

		void load();
	}, [itemId]);

	if (!itemId) {
		return null;
	}

	if (!item) {
		return (
			<div style={{ padding: spacing.xl, color: colors.textTertiary, fontSize: typography.sm }}>
				Loading issue details...
			</div>
		);
	}

	const description = typeof item.description === "string" ? item.description : "";
	const title = typeof item.title === "string" ? item.title : itemId;

	return (
		<div className="animate-slideInFromRight" style={{ display: "grid", gap: spacing.xl }}>
			<div style={{ display: "flex", alignItems: "flex-start", gap: spacing.md }}>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: radii.md,
						background: colors.primaryLight,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					<FileText size={16} color={colors.primary} />
				</div>
				<div>
					<h3
						style={{
							margin: 0,
							fontSize: typography.lg,
							fontWeight: typography.semibold,
							color: colors.textPrimary,
							lineHeight: typography.tight,
						}}
					>
						{title}
					</h3>
					<div
						style={{
							fontSize: typography.xs,
							color: colors.textTertiary,
							fontFamily: typography.monoFamily,
							marginTop: 2,
						}}
					>
						{itemId}
					</div>
				</div>
			</div>
			<DescriptionEditor
				value={description}
				onSave={async (nextValue) => {
					await updateNode("Issue", itemId, { description: nextValue });
					setItem((prev) => (prev ? { ...prev, description: nextValue } : prev));
				}}
			/>
			<PropertiesSidebar item={item} />
			<DependencyList itemId={itemId} edges={edges} />
			<ActivityLog item={item} />
		</div>
	);
}
