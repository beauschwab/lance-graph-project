import { useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { TableView } from "./components/views/TableView";
import { KanbanView } from "./components/views/KanbanView";
import { GanttView } from "./components/views/GanttView";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import { BottleneckReport } from "./components/analysis/BottleneckReport";
import { CriticalPathView } from "./components/analysis/CriticalPathView";
import { WorkloadHeatmap } from "./components/analysis/WorkloadHeatmap";
import { StaleWorkReport } from "./components/analysis/StaleWorkReport";
import { HandoffHotspots } from "./components/analysis/HandoffHotspots";
import { ImpactAnalysis } from "./components/analysis/ImpactAnalysis";
import { CommandPalette, type CommandItem } from "./components/layout/CommandPalette";
import { DetailPanel } from "./components/layout/DetailPanel";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUiStore } from "./stores/ui";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const view = useUiStore((state) => state.view);
  const setView = useUiStore((state) => state.setView);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  useKeyboardShortcuts({ onOpenCommandPalette: () => setPaletteOpen(true) });

  const commands = useMemo<CommandItem[]>(
    () => [
      { id: "goto-table", label: "Go to Table View", action: () => navigate("/") },
      { id: "goto-kanban", label: "Go to Kanban View", action: () => navigate("/kanban") },
      { id: "goto-gantt", label: "Go to Gantt View", action: () => navigate("/gantt") },
      { id: "goto-settings", label: "Go to Settings", action: () => navigate("/settings") },
      { id: "goto-analysis", label: "Go to Bottlenecks", action: () => navigate("/analysis/bottlenecks") },
      { id: "clear-selection", label: "Clear Selected Issue", action: () => setSelectedIssueId(null) },
    ],
    [navigate],
  );

  const showViewSwitcher = location.pathname === "/" || location.pathname === "/kanban" || location.pathname === "/gantt";

  const resolvedView = location.pathname === "/kanban" ? "kanban" : location.pathname === "/gantt" ? "gantt" : "table";

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", display: "grid", gridTemplateColumns: "220px 1fr 340px", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar
          title="Orchestration UI"
          view={showViewSwitcher ? resolvedView : view}
          onViewChange={(next) => {
            setView(next);
            if (next === "table") {
              navigate("/");
            } else if (next === "kanban") {
              navigate("/kanban");
            } else {
              navigate("/gantt");
            }
          }}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <div style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<TableView selectedIssueId={selectedIssueId} onSelectIssue={setSelectedIssueId} />} />
            <Route
              path="/kanban"
              element={<KanbanView selectedIssueId={selectedIssueId} onSelectIssue={setSelectedIssueId} />}
            />
            <Route path="/gantt" element={<GanttView selectedIssueId={selectedIssueId} onSelectIssue={setSelectedIssueId} />} />
            <Route path="/analysis/bottlenecks" element={<BottleneckReport />} />
            <Route path="/analysis/critical-path" element={<CriticalPathView />} />
            <Route path="/analysis/workload" element={<WorkloadHeatmap />} />
            <Route path="/analysis/stale-blockers" element={<StaleWorkReport />} />
            <Route path="/analysis/handoffs" element={<HandoffHotspots />} />
            <Route path="/analysis/impact" element={<ImpactAnalysis />} />
            <Route path="/settings/*" element={<SettingsLayout />} />
          </Routes>
        </div>
      </main>
      <DetailPanel selectedId={selectedIssueId} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}
