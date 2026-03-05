from pathlib import Path

import pytest

from lance_graph_project.graph_config import load_schema, SCHEMA_PATH, build_graph_config


def test_schema_file_exists() -> None:
    assert SCHEMA_PATH.exists()


def test_schema_includes_expected_labels_and_relationships() -> None:
    pytest.importorskip("yaml")
    schema = load_schema()

    expected_nodes = {
        "Program",
        "Workstream",
        "Feature",
        "Epic",
        "Issue",
        "Milestone",
        "Team",
        "Person",
        "Application",
        "Artifact",
        "Tag",
        "StatusConfig",
        "PriorityConfig",
    }
    expected_relationships = {
        "CONTAINS",
        "DEPENDS_ON",
        "ASSIGNED_TO",
        "HANDOFF_TO",
        "DELIVERS",
        "RELATES_TO",
        "TAGGED_WITH",
    }

    assert expected_nodes.issubset(schema["nodes"].keys())
    assert expected_relationships.issubset(schema["relationships"].keys())


def test_build_graph_config_when_lance_graph_installed() -> None:
    pytest.importorskip("lance_graph")
    config = build_graph_config(Path(SCHEMA_PATH))
    assert config is not None
