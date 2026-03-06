import { Component, type ErrorInfo, type ReactNode } from "react";
import { colors, spacing, typography, radii } from "../../theme";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // placeholder for telemetry hook
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.huge,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: radii.xl,
              background: colors.statusBlockedBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.lg,
              fontSize: 20,
            }}
          >
            ⚠️
          </div>
          <div style={{ fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Something went wrong
          </div>
          <div style={{ fontSize: typography.sm, color: colors.textTertiary }}>
            Please refresh the page or try again later.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
