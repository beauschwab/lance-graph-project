import { useState } from "react";

import { api } from "../../api/client";

export function ImportExportSettings() {
  const [path, setPath] = useState("exports/snapshot.json");
  const [message, setMessage] = useState("");

  async function exportSnapshot() {
    const response = await api.get("/export", { params: { format: "json", output_path: path } });
    setMessage(`Exported to ${response.data.path}`);
  }

  return (
    <section>
      <h3>Import / Export</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={path} onChange={(event) => setPath(event.target.value)} />
        <button type="button" onClick={() => void exportSnapshot()}>
          Export JSON Snapshot
        </button>
      </div>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
