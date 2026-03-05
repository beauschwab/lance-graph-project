import { Link, Route, Routes } from "react-router-dom";

import { ApplicationSettings } from "./ApplicationSettings";
import { ImportExportSettings } from "./ImportExportSettings";
import { TeamsSettings } from "./TeamsSettings";
import { PeopleSettings } from "./PeopleSettings";
import { PrioritySettings } from "./PrioritySettings";
import { StatusSettings } from "./StatusSettings";
import { TagSettings } from "./TagSettings";

export function SettingsLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      <aside style={{ borderRight: "1px solid #ddd", paddingRight: 12, display: "grid", gap: 8 }}>
        <strong>Settings</strong>
        <Link to="teams">Teams</Link>
        <Link to="people">People</Link>
        <Link to="applications">Applications</Link>
        <Link to="statuses">Statuses</Link>
        <Link to="priorities">Priorities</Link>
        <Link to="tags">Tags</Link>
        <Link to="import-export">Import / Export</Link>
      </aside>

      <main>
        <Routes>
          <Route path="/" element={<TeamsSettings />} />
          <Route path="teams" element={<TeamsSettings />} />
          <Route path="people" element={<PeopleSettings />} />
          <Route path="applications" element={<ApplicationSettings />} />
          <Route path="statuses" element={<StatusSettings />} />
          <Route path="priorities" element={<PrioritySettings />} />
          <Route path="tags" element={<TagSettings />} />
          <Route path="import-export" element={<ImportExportSettings />} />
        </Routes>
      </main>
    </div>
  );
}
