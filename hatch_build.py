"""Custom Hatch build hook: builds the React frontend and bundles schema.yaml."""

from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class FrontendBuildHook(BuildHookInterface):
    PLUGIN_NAME = "custom"

    def initialize(self, version: str, build_data: dict) -> None:
        root = Path(self.root)
        pkg_dir = root / "src" / "lance_graph_project"

        self._copy_schema(root, pkg_dir)
        self._build_frontend(root, pkg_dir)

    # ------------------------------------------------------------------
    # schema.yaml → package directory
    # ------------------------------------------------------------------
    def _copy_schema(self, root: Path, pkg_dir: Path) -> None:
        src = root / "schema.yaml"
        dst = pkg_dir / "schema.yaml"
        if src.exists():
            shutil.copy2(src, dst)
            self.app.display_info(f"Copied schema.yaml → {dst}")

    # ------------------------------------------------------------------
    # Frontend build (npm ci && npm run build)
    # ------------------------------------------------------------------
    def _build_frontend(self, root: Path, pkg_dir: Path) -> None:
        frontend_dir = root / "frontend"
        static_dir = pkg_dir / "static"

        if not frontend_dir.exists():
            self.app.display_warning("frontend/ not found – skipping frontend build")
            return

        npm = shutil.which("npm")
        if npm is None:
            self.app.display_warning("npm not found – skipping frontend build")
            return

        self.app.display_info("Installing frontend dependencies …")
        subprocess.run(
            [npm, "ci", "--ignore-scripts"],
            cwd=str(frontend_dir),
            check=True,
            env={**os.environ, "CI": "true"},
        )

        self.app.display_info("Building frontend …")
        subprocess.run(
            [npm, "run", "build"],
            cwd=str(frontend_dir),
            check=True,
        )

        # Vite outputs to frontend/dist by default
        dist_dir = frontend_dir / "dist"
        if not dist_dir.exists():
            self.app.display_warning("frontend/dist not found after build – skipping")
            return

        # Copy built files into the package
        if static_dir.exists():
            shutil.rmtree(static_dir)
        shutil.copytree(dist_dir, static_dir)
        self.app.display_info(f"Copied frontend build → {static_dir}")
