import { NavLink, Route, Routes } from "react-router-dom";
import { Users, UserCircle, AppWindow, ListChecks, Signal, Tag, ArrowDownUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ApplicationSettings } from "./ApplicationSettings";
import { ImportExportSettings } from "./ImportExportSettings";
import { TeamsSettings } from "./TeamsSettings";
import { PeopleSettings } from "./PeopleSettings";
import { PrioritySettings } from "./PrioritySettings";
import { StatusSettings } from "./StatusSettings";
import { TagSettings } from "./TagSettings";
import { colors, spacing, radii, typography } from "../../theme";

const LINKS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "teams", label: "Teams", icon: Users },
  { to: "people", label: "People", icon: UserCircle },
  { to: "applications", label: "Applications", icon: AppWindow },
  { to: "statuses", label: "Statuses", icon: ListChecks },
  { to: "priorities", label: "Priorities", icon: Signal },
  { to: "tags", label: "Tags", icon: Tag },
  { to: "import-export", label: "Import / Export", icon: ArrowDownUp },
];

export function SettingsLayout() {
  return (
    <div className="animate-fadeIn" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: spacing.xxl }}>
      <aside style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontSize: typography.xs,
            fontWeight: typography.semibold,
            color: colors.textTertiary,
            textTransform: "uppercase" as const,
            letterSpacing: typography.wider,
            padding: `${spacing.sm}px ${spacing.md}px`,
            marginBottom: spacing.sm,
          }}
        >
          Settings
        </div>
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: spacing.md,
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radii.md,
                fontSize: typography.base,
                fontWeight: isActive ? typography.medium : typography.normal,
                color: isActive ? colors.primary : colors.textSecondary,
                background: isActive ? colors.primaryLight : "transparent",
                transition: "all 150ms ease",
              })}
            >
              <Icon size={15} strokeWidth={1.75} />
              {link.label}
            </NavLink>
          );
        })}
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
