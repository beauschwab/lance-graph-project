import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { colors, spacing, radii, typography, shadows } from "../../theme";

type DescriptionEditorProps = {
	value: string;
	onSave: (nextValue: string) => Promise<void>;
};

export function DescriptionEditor({ value, onSave }: DescriptionEditorProps) {
	const [draft, setDraft] = useState(value);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setDraft(value);
	}, [value]);

	const hasChanges = draft !== value;

	return (
		<section>
			<div
				style={{
					fontSize: typography.xs,
					fontWeight: typography.semibold,
					color: colors.textSecondary,
					textTransform: "uppercase" as const,
					letterSpacing: typography.wider,
					marginBottom: spacing.sm,
				}}
			>
				Description
			</div>
			<textarea
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				rows={5}
				style={{
					width: "100%",
					resize: "vertical",
					padding: spacing.lg,
					border: `1px solid ${colors.border}`,
					borderRadius: radii.md,
					fontSize: typography.base,
					color: colors.textPrimary,
					background: colors.surfacePrimary,
					lineHeight: typography.relaxed,
					outline: "none",
					transition: "border-color 150ms ease, box-shadow 150ms ease",
				}}
				onFocus={(e) => {
					e.currentTarget.style.borderColor = colors.borderFocus;
					e.currentTarget.style.boxShadow = shadows.glow;
				}}
				onBlur={(e) => {
					e.currentTarget.style.borderColor = colors.border;
					e.currentTarget.style.boxShadow = "none";
				}}
			/>
			{hasChanges && (
				<div style={{ marginTop: spacing.md }}>
					<button
						type="button"
						disabled={saving}
						onClick={async () => {
							setSaving(true);
							try {
								await onSave(draft);
							} finally {
								setSaving(false);
							}
						}}
						style={{
							display: "flex",
							alignItems: "center",
							gap: spacing.xs,
							padding: `${spacing.sm}px ${spacing.lg}px`,
							border: "none",
							borderRadius: radii.md,
							background: colors.primary,
							color: colors.primaryText,
							fontSize: typography.sm,
							fontWeight: typography.medium,
							cursor: saving ? "wait" : "pointer",
							opacity: saving ? 0.7 : 1,
						}}
					>
						<Save size={13} />
						{saving ? "Saving..." : "Save"}
					</button>
				</div>
			)}
		</section>
	);
}
