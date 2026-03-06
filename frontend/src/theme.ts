/**
 * Design Token System — "Orchestrate"
 *
 * A refined, modern design language inspired by premium developer tools.
 * Dark sidebar for navigation focus, light workspace for content clarity,
 * and vibrant semantic colors for status-at-a-glance.
 */

/* ── Color Palette ─────────────────────────────────────────────── */

export const colors = {
  /* Sidebar / chrome */
  sidebarBg: "#0f1117",
  sidebarBgHover: "#1a1d27",
  sidebarBgActive: "rgba(99, 102, 241, 0.15)",
  sidebarText: "#8b8fa3",
  sidebarTextActive: "#e2e4ed",
  sidebarBorder: "#1e2130",
  sidebarAccent: "#6366f1",

  /* Workspace surface */
  pageBg: "#f4f5f7",
  surfacePrimary: "#ffffff",
  surfaceSecondary: "#f8f9fb",
  surfaceHover: "#f1f3f9",
  surfaceSelected: "#eef0ff",

  /* Borders */
  border: "#e2e5ee",
  borderLight: "#edeef3",
  borderFocus: "#6366f1",

  /* Text */
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  textInverse: "#f8fafc",

  /* Primary / accent */
  primary: "#6366f1",
  primaryHover: "#4f46e5",
  primaryLight: "#eef2ff",
  primaryText: "#ffffff",

  /* Status semantic colors */
  statusTodo: "#f59e0b",
  statusTodoBg: "#fef3c7",
  statusTodoText: "#92400e",

  statusInProgress: "#3b82f6",
  statusInProgressBg: "#dbeafe",
  statusInProgressText: "#1e40af",

  statusBlocked: "#ef4444",
  statusBlockedBg: "#fee2e2",
  statusBlockedText: "#991b1b",

  statusDone: "#10b981",
  statusDoneBg: "#d1fae5",
  statusDoneText: "#065f46",

  /* Priority colors */
  priorityCritical: "#dc2626",
  priorityHigh: "#f97316",
  priorityMedium: "#eab308",
  priorityLow: "#6b7280",
  priorityNone: "#d1d5db",

  /* Misc */
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.06)",
  shadowMedium: "rgba(0, 0, 0, 0.1)",

  /* Graph / chart palette */
  chart1: "#6366f1",
  chart2: "#06b6d4",
  chart3: "#f59e0b",
  chart4: "#ef4444",
  chart5: "#10b981",
} as const;

/* ── Typography ────────────────────────────────────────────────── */

export const typography = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  monoFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace",

  /* Font sizes */
  xs: "11px",
  sm: "12px",
  base: "13px",
  md: "14px",
  lg: "16px",
  xl: "20px",
  xxl: "24px",

  /* Font weights */
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,

  /* Line heights */
  tight: 1.25,
  relaxed: 1.625,

  /* Letter spacing */
  tighter: "-0.02em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.08em",
} as const;

/* ── Spacing ───────────────────────────────────────────────────── */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/* ── Radii ─────────────────────────────────────────────────────── */

export const radii = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  xxl: 12,
  pill: 999,
} as const;

/* ── Shadows ───────────────────────────────────────────────────── */

export const shadows = {
  xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
  glow: "0 0 0 3px rgba(99, 102, 241, 0.15)",
  inset: "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
} as const;

/* ── Transitions ───────────────────────────────────────────────── */

export const transitions = {
  fast: "120ms ease",
  normal: "200ms ease",
  smooth: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/* ── Layout ────────────────────────────────────────────────────── */

export const layout = {
  sidebarWidth: 240,
  detailPanelWidth: 360,
  topBarHeight: 56,
  maxContentWidth: 1440,
} as const;

/* ── Status helpers ────────────────────────────────────────────── */

export type StatusKey = "todo" | "in_progress" | "blocked" | "done";

export const statusConfig: Record<
  StatusKey,
  { label: string; color: string; bg: string; textColor: string }
> = {
  todo: {
    label: "Todo",
    color: colors.statusTodo,
    bg: colors.statusTodoBg,
    textColor: colors.statusTodoText,
  },
  in_progress: {
    label: "In Progress",
    color: colors.statusInProgress,
    bg: colors.statusInProgressBg,
    textColor: colors.statusInProgressText,
  },
  blocked: {
    label: "Blocked",
    color: colors.statusBlocked,
    bg: colors.statusBlockedBg,
    textColor: colors.statusBlockedText,
  },
  done: {
    label: "Done",
    color: colors.statusDone,
    bg: colors.statusDoneBg,
    textColor: colors.statusDoneText,
  },
};

export function getStatusStyle(status: string) {
  const key = status as StatusKey;
  return (
    statusConfig[key] ?? {
      label: status,
      color: colors.textTertiary,
      bg: colors.surfaceSecondary,
      textColor: colors.textSecondary,
    }
  );
}

/* ── Priority helpers ──────────────────────────────────────────── */

export function getPriorityColor(priority: number): string {
  if (priority <= 1) return colors.priorityCritical;
  if (priority <= 2) return colors.priorityHigh;
  if (priority <= 3) return colors.priorityMedium;
  if (priority <= 4) return colors.priorityLow;
  return colors.priorityNone;
}

export function getPriorityLabel(priority: number): string {
  if (priority <= 1) return "Critical";
  if (priority <= 2) return "High";
  if (priority <= 3) return "Medium";
  if (priority <= 4) return "Low";
  return "None";
}
