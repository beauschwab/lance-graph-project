from __future__ import annotations

from click.testing import CliRunner

from lance_graph_project.cli import cli


def test_cli_query_command() -> None:
    runner = CliRunner()
    result = runner.invoke(cli, ["query", "snapshot"])
    assert result.exit_code == 0
