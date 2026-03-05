# SKILL.md - Orchestration Graph Agent Skills

## Overview
This project is a local graph-backed orchestration system. Data is modeled as typed nodes and edges and exposed via FastAPI and MCP tools.

## Available MCP Tools

### Read-Only
- `search_items(query, scope_workstream?, scope_milestone?, top_k?)`
- `get_item(item_type, item_id)`
- `get_dependencies(item_id, direction?, max_depth?)`
- `get_items_by_filter(item_type?, status?, team?, priority?, workstream?, tags?, limit?)`
- `run_cypher_query(cypher)`
- `get_bottlenecks(workstream?, top_k?)`
- `get_critical_path(milestone_id)`
- `run_impact_analysis(item_id, slip_days)`
- `get_team_workload(team_id?)`
- `get_stale_blockers(threshold_days?)`
- `get_handoff_hotspots()`

### Write
- `create_item(item_type, title, ...)`
- `update_item(item_type, item_id, updates)`
- `link_dependency(src_id, dst_id, ...)`
- `remove_dependency(src_id, dst_id)`
- `assign_item(item_id, person_id, role?)`

### Resources
- `project://schema`
- `project://teams`
- `project://milestones`
- `project://stats`
- `project://settings/statuses`
- `project://settings/priorities`

## Node Types
Program, Workstream, Feature, Epic, Issue, Milestone, Team, Person, Application, Artifact, Tag, StatusConfig, PriorityConfig

## Edge Types
CONTAINS, DEPENDS_ON, ASSIGNED_TO, HANDOFF_TO, DELIVERS, RELATES_TO, TAGGED_WITH

## Best Practices
1. Check `project://schema` before building assumptions about fields.
2. Prefer dedicated tools (`run_impact_analysis`, `get_bottlenecks`) over raw query for common workflows.
3. Ground every answer in returned graph data and avoid synthetic IDs.
