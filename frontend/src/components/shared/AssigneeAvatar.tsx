import { colors, typography, radii } from "../../theme";

type AssigneeAvatarProps = { name: string };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "#6366f1", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#3b82f6", "#14b8a6", "#f97316",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AssigneeAvatar({ name }: AssigneeAvatarProps) {
  if (!name || name === "-") {
    return (
      <span style={{ fontSize: typography.xs, color: colors.textTertiary }}>
        Unassigned
      </span>
    );
  }

  const bg = getColor(name);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: radii.pill,
          background: bg,
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: typography.semibold,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {getInitials(name)}
      </span>
      <span style={{ fontSize: typography.sm, color: colors.textSecondary }}>
        {name}
      </span>
    </span>
  );
}
