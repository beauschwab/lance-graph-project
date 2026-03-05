import { useEffect, useState } from "react";

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

	return (
		<section>
			<h4 style={{ margin: "0 0 8px" }}>Description</h4>
			<textarea
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				rows={6}
				style={{ width: "100%", resize: "vertical" }}
			/>
			<div style={{ marginTop: 8 }}>
				<button
					type="button"
					disabled={saving || draft === value}
					onClick={async () => {
						setSaving(true);
						try {
							await onSave(draft);
						} finally {
							setSaving(false);
						}
					}}
				>
					{saving ? "Saving..." : "Save Description"}
				</button>
			</div>
		</section>
	);
}
