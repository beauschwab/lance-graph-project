from __future__ import annotations

from pathlib import Path
import json
import subprocess
import sys
import time

import click
import uvicorn

from lance_graph_project.api.app import app
from lance_graph_project.services.container import get_import_export_service, get_node_service, get_query_service
from lance_graph_project.storage.project import ProjectStore


@click.group()
def cli() -> None:
    """Lance graph orchestration CLI."""


@cli.command("init")
@click.argument("project_path", type=click.Path(path_type=Path))
@click.option("--name", required=True)
def init_project(project_path: Path, name: str) -> None:
    ProjectStore.init_project(project_path, name)
    click.echo(f"Initialized project at {project_path}")


@cli.command("serve")
@click.option("--host", default="127.0.0.1")
@click.option("--port", default=8000, type=int)
def serve(host: str, port: int) -> None:
    uvicorn.run(app, host=host, port=port)


@cli.command("start")
@click.option("--host", default="127.0.0.1")
@click.option("--port", default=8000, type=int)
@click.option("--frontend/--no-frontend", default=True)
@click.option("--frontend-dir", default="frontend", type=click.Path(path_type=Path))
def start_stack(host: str, port: int, frontend: bool, frontend_dir: Path) -> None:
    """Start backend and optionally the frontend dev server."""

    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "lance_graph_project.api.app:app",
        "--host",
        host,
        "--port",
        str(port),
    ]
    backend_proc = subprocess.Popen(backend_cmd)
    frontend_proc: subprocess.Popen[bytes] | None = None

    click.echo(f"Backend started on http://{host}:{port}")
    if frontend:
        npm_executable = "npm.cmd" if sys.platform.startswith("win") else "npm"
        frontend_proc = subprocess.Popen([npm_executable, "run", "dev"], cwd=str(frontend_dir))
        click.echo("Frontend dev server starting via npm run dev")

    try:
        while True:
            if backend_proc.poll() is not None:
                raise RuntimeError("Backend process exited unexpectedly")
            if frontend_proc is not None and frontend_proc.poll() is not None:
                raise RuntimeError("Frontend process exited unexpectedly")
            time.sleep(0.5)
    except KeyboardInterrupt:
        click.echo("Stopping stack...")
    finally:
        for proc in [frontend_proc, backend_proc]:
            if proc is not None and proc.poll() is None:
                proc.terminate()
        for proc in [frontend_proc, backend_proc]:
            if proc is not None:
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()


@cli.command("query")
@click.argument("cypher")
def query(cypher: str) -> None:
    result = get_query_service().execute_cypher(cypher)
    click.echo(json.dumps(result, indent=2))


@cli.command("export")
@click.argument("output_path", type=click.Path(path_type=Path))
def export_json(output_path: Path) -> None:
    exported = get_import_export_service().export_json(output_path)
    click.echo(f"Exported snapshot to {exported}")


@cli.command("seed")
def seed() -> None:
    node_service = get_node_service()
    team = node_service.create_node("Team", {"team_id": "TEAM-CORE", "name": "Core"})
    person = node_service.create_node("Person", {"person_id": "PER-001", "name": "Alex", "team_id": team["team_id"]})
    issue = node_service.create_node(
        "Issue",
        {
            "issue_id": "ISS-001",
            "title": "Initial seeded issue",
            "description": "Generated via CLI seed",
            "status": "todo",
            "priority": 3,
            "epic_id": "EPC-SEED",
            "sort_order": 1,
        },
    )
    click.echo(f"Seeded records: {person['person_id']}, {issue['issue_id']}")


def main() -> None:
    cli()
