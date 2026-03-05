"""Custom Hatch build hook that builds the frontend and bundles it into the wheel."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    """Build the React frontend and include static assets in the wheel."""

    PLUGIN_NAME = "custom"

    def initialize(self, version: str, build_data: dict) -> None:  # noqa: ARG002
        root = Path(self.root)
        frontend_dir = root / "frontend"
        static_dir = root / "src" / "lance_graph_project" / "static"
        pkg_dir = root / "src" / "lance_graph_project"

        # --- Bundle schema.yaml inside the package ---
        schema_src = root / "schema.yaml"
        schema_dst = pkg_dir / "schema.yaml"
        if schema_src.exists() and not schema_dst.exists():
            shutil.copy2(str(schema_src), str(schema_dst))
            print(f"Copied schema.yaml into {schema_dst.relative_to(root)}")

        # --- Build the frontend ---
        if not frontend_dir.exists():
            return

        npm = shutil.which("npm")
        if npm is None:
            print(
                "WARNING: npm not found – skipping frontend build. "
                "The wheel will not contain the bundled UI.",
                file=sys.stderr,
            )
            return

        print("Installing frontend dependencies …")
        subprocess.check_call([npm, "ci", "--ignore-scripts"], cwd=str(frontend_dir))

        print("Building frontend …")
        subprocess.check_call([npm, "run", "build"], cwd=str(frontend_dir))

        if not static_dir.exists():
            raise RuntimeError(
                f"Frontend build did not produce output at {static_dir}"
            )

        print(f"Frontend assets bundled into {static_dir.relative_to(root)}")
