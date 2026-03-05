# Local Graph Project Orchestration DB — Product & Technical Specification

## Built on lance-format/lance-graph | React/Vite/Tailwind/shadcn Frontend | FastMCP Agent Layer

**Version:** 0.2.0-draft
**Date:** March 2026
**Status:** Design Phase (M0)

---

## Table of Contents

- [Part I: Product Specification](#part-i-product-specification)
- [Part II: Technical Specification — Backend](#part-ii-technical-specification--backend)
- [Part III: Frontend — React/Vite/Tailwind/shadcn UI](#part-iii-frontend--reactvitetailwindshadcn-ui)
- [Part IV: MCP Server & Agent Skills](#part-iv-mcp-server--agent-skills)
- [Part V: Implementation Plan](#part-v-implementation-plan)

---

# Part I: Product Specification

## 1. Executive Summary

This document specifies a **local-first, embedded graph-backed project orchestration system** that models complex programs with multiple teams, workstreams, dependencies, and handoffs. The system leverages **lance-graph** (a Cypher-capable graph query engine built in Rust with Python bindings) as the foundational query layer, combined with the **Lance columnar format** for persistent storage and native vector search for semantic retrieval.

The product delivers a **ClickUp-class frontend experience** built with React, Vite, Tailwind CSS, and shadcn/ui — featuring drag-and-drop tables, Kanban boards, interactive Gantt charts with dependency drawing, freeform descriptions, and tagging. All mutations in the UI push back to the Lance graph backend via a FastAPI service layer.

An integrated **MCP (Model Context Protocol) server** exposes the full orchestration engine as tools, resources, and prompts for AI agents, enabling natural-language project querying, impact analysis, and automated orchestration through any MCP-compatible client (Claude Desktop, Cursor, custom agents).

## 2. Problem Statement

Modern project management tools optimize for individual ticket workflows but fall short on structural intelligence: multi-team dependency webs, cross-stream handoffs, impact analysis when timelines shift, and meaning-based retrieval ("the auth token thing we discussed last month"). The result is coordination tax, missed critical-path risks, and surprise blockers that surface too late.

Existing tools also lack AI-native integration — project data lives in silos that agents cannot query structurally. There is no standard way for an LLM to ask "what breaks if this slips?" against a real dependency graph.

## 3. Goals and Non-Goals

### Goals

- Represent program structure as a typed property graph with nodes and edges stored as Lance datasets
- Enable fast dependency traversal and impact analysis via Cypher queries with variable-length path expansion
- Provide embedded semantic search across work items and artifacts using Lance's native vector indexing (IVF_PQ / IVF_HNSW_PQ)
- Deliver a **ClickUp-style frontend** with table views, Kanban boards, Gantt charts, drag-and-drop reordering, inline editing, dependency visualization, freeform rich-text descriptions, and tagging
- Provide **configurable settings** for teams, applications, feature owners, custom statuses, priority levels, tag taxonomies, and other organizational metadata
- Push all UI mutations back to the Lance graph backend for single source of truth
- Expose the orchestration engine as an **MCP server** with tools, resources, and prompts for AI agent integration
- Deliver actionable views including bottleneck detection, critical-path approximations, ownership load, and handoff hotspots
- Keep the system local and portable — runs on a developer laptop without cloud services

### Non-Goals (v1)

- Full enterprise workflow replacement (permissions, approvals, RBAC)
- High-throughput transactional workloads
- Mathematically optimal critical-path scheduling
- Real-time multi-user collaboration (single-writer model initially)
- Mobile-native apps (responsive web only for v1)

## 4. Target Users

- **Program/Project Managers** coordinating multiple workstreams/teams
- **Engineering Managers / Tech Leads** who need dependency clarity
- **Product leads** tracking features and delivery risk
- **Ops/Release managers** coordinating milestones and cutovers
- **AI Agents** (via MCP) performing automated analysis, reporting, and orchestration tasks

## 5. Key Use Cases

### UC1 — Hierarchy Modeling
Create Features, Epics, and Issues linked in a containment hierarchy via `CONTAINS` edges. Navigate up and down the hierarchy using Cypher variable-length paths. Visualize hierarchy in collapsible table rows.

### UC2 — Dependency Mapping
Model `DEPENDS_ON` / `BLOCKS` relationships between any work items. Draw dependency arrows directly on the Gantt chart. Query transitive dependencies at arbitrary depth.

### UC3 — Handoff Tracking
Model handoffs between teams with typed edges carrying SLA metadata. Identify handoff hotspots through fan-in/fan-out analysis. Visualize handoffs as cross-lane connections in Kanban.

### UC4 — Ownership & Staffing
Assign teams and people to items via `ASSIGNED_TO` edges. Configure team rosters and feature owners in Settings. View workload per team with aggregate estimates.

### UC5 — Timeline & Risk
Store start/end/estimate dates as node properties. Drag Gantt bars to adjust dates; dependents auto-reschedule. Compute blocked-item lists and approximate critical paths using DAG traversal.

### UC6 — Impact Analysis
Given a slipping task, traverse all downstream `DEPENDS_ON` paths to identify impacted milestones and teams. Highlight affected items in all views.

### UC7 — Semantic Retrieval
Search by meaning across work item titles, descriptions, and notes using vector embeddings. Combine with graph filters (status, team, workstream) for scoped hybrid search.

### UC8 — Bottleneck Detection
Identify high fan-in nodes (many prerequisites), overloaded teams (high total estimate), and stale blockers (unresolved beyond threshold days).

### UC9 — AI Agent Orchestration (MCP)
Ask an AI agent "What are the top blockers for Milestone Q2?" and receive structured answers grounded in the live dependency graph. Agent can create tasks, link dependencies, run impact analysis, and generate reports.

### UC10 — Settings & Configuration
Configure teams, team members, applications/systems, feature owners, custom statuses, priority levels, tag taxonomies, and handoff types through a dedicated Settings UI. All configuration stored as graph nodes and available as dropdown/autocomplete options throughout the app.

## 6. Success Metrics

- Time-to-answer dependency questions drops from hours to minutes
- Reduction in "surprise blockers" surfaced in post-mortems
- Query performance: p95 traversal query under 50ms for graphs up to 10K nodes
- Semantic search latency under 200ms for hybrid queries
- Frontend interaction latency: all drag-drop operations reflect in under 300ms
- MCP tool response time under 2s for standard queries, under 10s for complex analysis
- Data freshness: percentage of items with updated status within last 7 days exceeds 80%

---

# Part II: Technical Specification — Backend

## 7. Technology Foundation: lance-graph

**lance-graph** (v0.3.1, Apache 2.0) is a Cypher-capable graph query engine with a Rust core and Python bindings via PyO3. It interprets Lance datasets as property graphs and translates Cypher queries into optimized SQL via Apache DataFusion.

### 7.1 Query Processing Pipeline

The pipeline has four stages:

1. **Cypher Parsing** — nom parser combinators produce an AST from Cypher query strings
2. **Semantic Analysis** — Validates variables, labels, and properties against `GraphConfig`; builds a symbol table
3. **Logical Planning** — Generates graph-specific operators (Filter, Join, Expand) as a `LogicalOperator` tree
4. **Physical Planning** — `DataFusionPlanner` translates to DataFusion SQL logical plans for execution over Arrow columnar data

### 7.2 Key Capabilities for This Product

- **Variable-length path expansion** (`-[:REL*1..N]->`) for transitive dependency traversal. `MAX_VARIABLE_LENGTH_HOPS` bounds depth to prevent runaway queries.
- **VectorSearch builder API** with L2, Cosine, and Dot distance metrics. Supports brute-force search on in-memory Arrow data and Lance ANN index integration.
- **`execute_with_vector_rerank`** implements the GraphRAG pattern: filter candidates with a Cypher graph query, then rerank by vector similarity.
- **Cypher UDFs** `vector_distance()` and `vector_similarity()` for inline semantic + structural queries.
- **Dual data paths**: in-memory (`HashMap<String, RecordBatch>`) and persistent (Lance datasets on local filesystem). `GraphSourceCatalog` abstracts both behind a unified DataFusion interface.
- The `knowledge_graph` Python package provides Lance-backed persistence, a CLI, and a FastAPI web service as the starting scaffold for this product.

### 7.3 Performance Benchmarks (from lance-graph, illustrative, x86_64)

| Benchmark | Size | Median Time | Throughput |
|-----------|------|-------------|------------|
| basic_node_filter | 10K | ~715 µs | ~13.98 Melem/s |
| single_hop_expand | 10K | ~3.77 ms | ~2.65 Melem/s |
| two_hop_expand | 10K | ~6.41 ms | ~1.56 Melem/s |

Interactive traversal on programs with thousands of work items is well within real-time targets.

## 8. Data Model

### 8.1 Node Types (Lance Datasets)

Each node type is stored as a separate Lance dataset within the project directory. All tables include a primary key column registered via `GraphConfig.with_node_label()`.

**Program:** `program_id` (str), `name`, `description`, `status`, `start_date`, `target_date`, `embedding` (vector[384])

**Workstream:** `workstream_id` (str), `name`, `description`, `status`, `program_id` (FK), `owner_team_id`, `embedding` (vector[384])

**Feature:** `feature_id` (str), `title`, `description`, `status`, `priority` (int), `workstream_id` (FK), `tags` (list[str]), `embedding` (vector[384])

**Epic:** `epic_id` (str), `title`, `description`, `status`, `priority` (int), `feature_id` (FK), `estimate_days` (float), `start_date`, `target_date`, `tags` (list[str]), `embedding` (vector[384])

**Issue:** `issue_id` (str), `title`, `description` (rich text / markdown), `status`, `priority` (int), `epic_id` (FK), `estimate_days` (float), `start_date`, `target_date`, `actual_date`, `risk_level` (str), `tags` (list[str]), `sort_order` (int), `embedding` (vector[384])

**Milestone:** `milestone_id` (str), `name`, `description`, `target_date`, `status`, `embedding` (vector[384])

**Team:** `team_id` (str), `name`, `capacity_points` (int), `lead_name`, `color` (str, hex)

**Person:** `person_id` (str), `name`, `email`, `team_id` (FK), `role`, `avatar_url`

**Application:** `app_id` (str), `name`, `description`, `owner_team_id` (FK), `tech_stack` (list[str])

**Artifact:** `artifact_id` (str), `title`, `content_summary`, `url`, `artifact_type`, `embedding` (vector[384])

**Tag:** `tag_id` (str), `name`, `color` (str, hex), `category` (str)

**StatusConfig:** `status_id` (str), `name`, `color` (str, hex), `category` (str: todo / in_progress / done / blocked), `sort_order` (int)

**PriorityConfig:** `priority_id` (str), `name`, `color` (str, hex), `level` (int), `icon` (str)

### 8.2 Edge Types (Relationship Tables)

**CONTAINS:** `src_id`, `dst_id`, `container_type` (program→workstream, workstream→feature, feature→epic, epic→issue), `created_at`

**DEPENDS_ON:** `src_id`, `dst_id`, `dependency_type` (technical, data, approval), `lag_days` (int), `reason` (str), `created_at`, `resolved_at`

**BLOCKS** is derived as the inverse of DEPENDS_ON at query time — not stored separately.

**ASSIGNED_TO:** `src_id`, `dst_id`, `role` (owner, reviewer, implementer), `assigned_at`

**HANDOFF_TO:** `src_id`, `dst_id`, `handoff_type` (requirements, api_contract, qa, release), `sla_days` (int), `due_date`, `status`, `created_at`

**DELIVERS:** `milestone_id`, `workitem_id`, `commitment_level` (must_have, should_have, nice_to_have)

**RELATES_TO:** `artifact_id`, `workitem_id`, `relation_type` (spec, design, reference)

**TAGGED_WITH:** `workitem_id`, `tag_id`, `tagged_at`

### 8.3 GraphConfig Registration

```python
from lance_graph import GraphConfig

config = (
    GraphConfig.builder()
    # Node labels
    .with_node_label("Program", "program_id")
    .with_node_label("Workstream", "workstream_id")
    .with_node_label("Feature", "feature_id")
    .with_node_label("Epic", "epic_id")
    .with_node_label("Issue", "issue_id")
    .with_node_label("Milestone", "milestone_id")
    .with_node_label("Team", "team_id")
    .with_node_label("Person", "person_id")
    .with_node_label("Application", "app_id")
    .with_node_label("Tag", "tag_id")
    # Relationships
    .with_relationship("CONTAINS", "src_id", "dst_id")
    .with_relationship("DEPENDS_ON", "src_id", "dst_id")
    .with_relationship("ASSIGNED_TO", "src_id", "dst_id")
    .with_relationship("HANDOFF_TO", "src_id", "dst_id")
    .with_relationship("DELIVERS", "milestone_id", "workitem_id")
    .with_relationship("RELATES_TO", "artifact_id", "workitem_id")
    .with_relationship("TAGGED_WITH", "workitem_id", "tag_id")
    .build()
)
```

### 8.4 Vector Embedding Strategy

All searchable text fields (`title + description + notes`) are concatenated and embedded using a local model (e.g., `sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions) at write time. Embeddings stored as `FixedSizeListArray` columns in Lance datasets enable brute-force search on small datasets and ANN index creation (`IVF_PQ` or `IVF_HNSW_PQ`) as the graph grows.

The embedding pipeline runs locally using ONNX Runtime — no external API dependency, preserving the local-first design principle.

## 9. System Architecture

### 9.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Vite)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Table    │ │  Kanban  │ │  Gantt   │ │ Settings │ │  Search  │ │
│  │  View    │ │  Board   │ │  Chart   │ │  Panel   │ │  Bar     │ │
│  │ (TanStack│ │ (Kibo UI │ │ (SVAR    │ │ (shadcn  │ │ (hybrid  │ │
│  │ +dnd-kit)│ │ +dnd-kit)│ │ Gantt)   │ │ forms)   │ │ vector)  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       └─────────────┴────────────┴─────────────┴────────────┘       │
│                              │ HTTP / REST                          │
│                     Zustand / TanStack Query                        │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                     FastAPI Backend (Python)                         │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │                REST API Layer                             │       │
│  │  /api/nodes/*  /api/edges/*  /api/query  /api/search      │       │
│  │  /api/analyze/*  /api/settings/*  /api/import  /api/export│       │
│  └────────────────────────┬─────────────────────────────────┘       │
│  ┌────────────┐ ┌────────▼───────┐ ┌──────────────┐                │
│  │ CRUD +     │ │ Orchestration  │ │ Embedding    │                │
│  │ Schema     │ │ Engine         │ │ Pipeline     │                │
│  │ Validation │ │ (analysis,     │ │ (sentence-   │                │
│  │            │ │ critical path, │ │ transformers)│                │
│  │            │ │ bottlenecks)   │ │              │                │
│  └────────────┘ └────────────────┘ └──────────────┘                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │        lance-graph Query Layer (Rust + PyO3)              │       │
│  │  CypherQuery + GraphConfig + VectorSearch + GraphRAG      │       │
│  │  → DataFusion Planner → Arrow RecordBatch results         │       │
│  └────────────────────────┬─────────────────────────────────┘       │
│  ┌────────────────────────▼─────────────────────────────────┐       │
│  │              Lance Storage Layer                          │       │
│  │  ./project_data/{nodes,edges}/*.lance + ANN indices       │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                     MCP Server (FastMCP)                             │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │  Tools: create_task, link_dependency, run_impact_analysis │       │
│  │         search_items, get_bottlenecks, get_critical_path  │       │
│  │  Resources: project://schema, project://teams,            │       │
│  │             project://milestones, project://stats          │       │
│  │  Prompts: analyze_risk, plan_sprint, dependency_report    │       │
│  └──────────────────────────────────────────────────────────┘       │
│  Transport: stdio (Claude Desktop) | streamable-http (remote)       │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Layer Responsibilities

**Frontend (React/Vite/Tailwind/shadcn):** All user-facing views — table, Kanban, Gantt, settings, search. State management via Zustand for local UI state and TanStack Query for server state / cache invalidation. Every mutation triggers an API call that pushes changes back to the Lance graph.

**FastAPI Backend:** REST API for CRUD, graph queries, semantic search, analysis endpoints, settings management, and import/export. Extends the existing `knowledge_graph.webservice` architecture. Serves both the frontend and the MCP server.

**lance-graph Query Layer:** Cypher parsing, semantic analysis, logical planning, and DataFusion execution. Handles all graph traversal, filtering, aggregation, and vector search.

**Lance Storage Layer:** Persistent, versioned columnar storage. Each node/edge type as a `.lance` dataset. Crash-safe writes, zero-copy versioning, ANN indexing.

**MCP Server (FastMCP):** Exposes orchestration capabilities as MCP tools, resources, and prompts. Connects to the same backend engine internally. Supports stdio transport for Claude Desktop and streamable-http for remote agents.

### 9.3 REST API Design

The FastAPI service exposes a RESTful API consumed by both the React frontend and the MCP server:

**Nodes:**
- `GET    /api/nodes/{type}` — List nodes with filtering, sorting, pagination
- `POST   /api/nodes/{type}` — Create node (auto-embeds, auto-assigns sort_order)
- `GET    /api/nodes/{type}/{id}` — Read single node
- `PUT    /api/nodes/{type}/{id}` — Update node (partial update, re-embeds if text changes)
- `DELETE /api/nodes/{type}/{id}` — Soft delete node
- `PATCH  /api/nodes/{type}/reorder` — Bulk update sort_order (drag-drop reorder)
- `PATCH  /api/nodes/{type}/{id}/tags` — Add/remove tags

**Edges:**
- `POST   /api/edges/{type}` — Create edge
- `DELETE /api/edges/{type}/{src_id}/{dst_id}` — Delete edge
- `GET    /api/edges/{type}?src_id=X` — List edges by source

**Query:**
- `POST /api/query` — Execute arbitrary Cypher query
- `POST /api/search` — Semantic search with optional graph scope

**Analysis:**
- `GET  /api/analyze/bottlenecks?workstream=X` — Bottleneck report
- `GET  /api/analyze/critical-path/{milestone_id}` — Critical path
- `POST /api/analyze/impact` — Impact analysis for slipping tasks
- `GET  /api/analyze/workload?team=X` — Team workload summary
- `GET  /api/analyze/handoff-hotspots` — Cross-team handoff analysis
- `GET  /api/analyze/stale-blockers?threshold_days=14` — Stale blocker report

**Settings:**
- `GET  /api/settings/teams` — List teams
- `POST /api/settings/teams` — Create team
- `PUT  /api/settings/teams/{id}` — Update team
- `GET  /api/settings/people` — List people
- `GET  /api/settings/applications` — List applications
- `GET  /api/settings/statuses` — List status configurations
- `GET  /api/settings/priorities` — List priority configurations
- `GET  /api/settings/tags` — List tags
- `PUT  /api/settings/{entity}/{id}` — Update any settings entity

**Import/Export:**
- `POST /api/import` — Bulk import (JSON/CSV, Jira adapter)
- `GET  /api/export?format=json` — Export snapshot

**View-Specific Endpoints:**
- `GET /api/views/kanban?group_by=status&workstream=X` — Pre-computed Kanban columns
- `GET /api/views/gantt?milestone=X` — Gantt data with dependency edges
- `GET /api/views/table?type=Issue&filters=...` — Paginated table data

### 9.4 Example Cypher Queries (Capability Targets)

**Get all descendants of a Feature (any depth):**
```cypher
MATCH (f:Feature {feature_id: 'FEAT-101'})-[:CONTAINS*1..10]->(child)
RETURN child.title, child.status, labels(child) AS type
```

**Get transitive dependencies (N hops):**
```cypher
MATCH (t:Issue {issue_id: 'ISS-1042'})<-[:DEPENDS_ON*1..5]-(upstream)
RETURN upstream.issue_id, upstream.title, upstream.status
```

**Find all paths from Task A to Milestone B:**
```cypher
MATCH path = (task:Issue {issue_id: 'ISS-1042'})-[:DEPENDS_ON|CONTAINS*1..8]->(m:Milestone {milestone_id: 'MS-Q2'})
RETURN path
```

**Subgraph extraction by team:**
```cypher
MATCH (t:Team {team_id: 'backend'})<-[:ASSIGNED_TO]-(item)-[:DEPENDS_ON*0..3]->(dep)
RETURN item.title, dep.title, dep.status
```

**Hybrid semantic + graph search (within a workstream):**
```cypher
MATCH (ws:Workstream {workstream_id: 'WS-AUTH'})-[:CONTAINS*1..5]->(item)
WHERE vector_distance(item.embedding, $query_vector, cosine) < 0.3
RETURN item.title, item.status,
       vector_similarity(item.embedding, $query_vector, cosine) AS relevance
ORDER BY relevance DESC
LIMIT 10
```

**High fan-in / fan-out detection:**
```cypher
MATCH (item)<-[d:DEPENDS_ON]-(upstream)
WITH item, count(upstream) AS fan_in
ORDER BY fan_in DESC
LIMIT 20
RETURN item.title, item.status, fan_in
```

**Blocked items per team:**
```cypher
MATCH (t:Team)<-[:ASSIGNED_TO]-(item)-[:DEPENDS_ON]->(blocker)
WHERE blocker.status <> 'done'
RETURN t.name, item.title, blocker.title, blocker.status
ORDER BY t.name
```

**Overloaded team detection:**
```cypher
MATCH (t:Team)<-[:ASSIGNED_TO]-(item)
WHERE item.status IN ['open', 'in_progress']
WITH t, sum(item.estimate_days) AS total_load, count(item) AS item_count
WHERE total_load > t.capacity_points
RETURN t.name, total_load, t.capacity_points, item_count
ORDER BY total_load DESC
```

**Handoff hotspot detection:**
```cypher
MATCH (src_team:Team)<-[:ASSIGNED_TO]-(src_item)-[:HANDOFF_TO]->(dst_item)-[:ASSIGNED_TO]->(dst_team:Team)
WHERE src_team.team_id <> dst_team.team_id
WITH src_team.name AS from_team, dst_team.name AS to_team, count(*) AS handoff_count
ORDER BY handoff_count DESC
RETURN from_team, to_team, handoff_count
```

### 9.5 Project Directory Structure

```
my-program/
├── project.meta.json        # Project name, version, created_at
├── schema.yaml              # Node/edge type definitions
├── nodes/
│   ├── Program.lance/
│   ├── Workstream.lance/
│   ├── Feature.lance/
│   ├── Epic.lance/
│   ├── Issue.lance/
│   ├── Milestone.lance/
│   ├── Team.lance/
│   ├── Person.lance/
│   ├── Application.lance/
│   ├── Tag.lance/
│   ├── StatusConfig.lance/
│   └── PriorityConfig.lance/
├── edges/
│   ├── CONTAINS.lance/
│   ├── DEPENDS_ON.lance/
│   ├── ASSIGNED_TO.lance/
│   ├── HANDOFF_TO.lance/
│   ├── DELIVERS.lance/
│   ├── RELATES_TO.lance/
│   └── TAGGED_WITH.lance/
├── backups/
│   └── 2026-03-04T10-00-00.tar.gz
└── exports/
    └── (JSON/CSV snapshots)
```

---

# Part III: Frontend — React/Vite/Tailwind/shadcn UI

## 10. Frontend Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build** | Vite 6+ | Fast HMR, ES module bundler |
| **Framework** | React 18+ | UI rendering |
| **Routing** | React Router v7 | Client-side navigation |
| **Styling** | Tailwind CSS 4+ | Utility-first CSS |
| **UI Primitives** | shadcn/ui | Buttons, dialogs, forms, dropdowns, tooltips, popovers, command palette |
| **Advanced Components** | Kibo UI | Kanban board, Gantt chart composables (MIT, shadcn-native, copy-the-code model) |
| **Gantt Chart** | SVAR React Gantt (MIT) | Interactive timeline with drag-drop tasks, dependency arrows, zoom levels |
| **Data Tables** | TanStack Table v8 | Headless table with sorting, filtering, column visibility, pagination |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | Row reordering in tables, Kanban card drag, cross-column moves |
| **Rich Text** | Tiptap (or Kibo Editor) | Freeform descriptions with markdown, mentions, checklists |
| **State (server)** | TanStack Query v5 | Cache, refetch, optimistic updates for API data |
| **State (client)** | Zustand | UI state: active view, selected filters, panel toggles |
| **Forms** | React Hook Form + Zod | Settings forms, create/edit dialogs with validation |
| **Icons** | Lucide React | Consistent iconography matching shadcn |
| **Charts** | Recharts | Team workload bar charts, burndown, risk gauges |
| **Date Handling** | date-fns | Date arithmetic, formatting, business day calculations |

### 10.1 Library Selection Rationale

**SVAR React Gantt (MIT)** was chosen over Bryntum ($940+/dev, commercial), DHTMLX ($699+, commercial), and Frappe Gantt (too simple, no dependency drawing). SVAR provides native drag-drop, dependency support, React 19 compatibility, TypeScript types, and zoom levels under the MIT license.

**Kibo UI** was chosen for Kanban because it is shadcn-native — following the copy-the-code model (MIT license) where component files are placed directly in your project via `npx kibo-ui@latest add kanban`. This means we own the code and can extend/fix it directly. Kibo UI also provides Gantt composables that can serve as a fallback if SVAR proves insufficient.

**@dnd-kit** was chosen over react-beautiful-dnd (unmaintained) and native HTML5 drag events (poor mobile support). dnd-kit is modular, lightweight, works with semantic `<table>` markup, and is the library recommended by TanStack Table's official docs for row DnD.

**TanStack Table v8** is the industry standard headless table for React. Combined with shadcn/ui's Data Table pattern, it provides sorting, filtering, column visibility, row selection, and pagination out of the box. Row reordering is achieved by layering @dnd-kit on top.

## 11. Frontend Views & Interactions

### 11.1 Global Layout

The app uses a ClickUp-inspired layout:

**Left Sidebar** — Collapsible navigation: Program hierarchy (Workstreams → Features → Epics), Milestones, Teams, Settings, Search. Tree-view with expand/collapse. Active item highlighted. Width: 240px default, 60px collapsed.

**Top Bar** — Breadcrumb (Program > Workstream > Feature), View Switcher (Table | Kanban | Gantt | Timeline), Global Filters (status, team, priority, tags), Global Search (semantic + structural).

**Main Content Area** — Renders the active view. Full-width, scrollable.

**Right Detail Panel** — Slide-out panel (shadcn Sheet component) for item detail: title, freeform description, properties, dependency list, activity log. Opens on item click from any view. Width: 480px.

**Command Palette** — `Cmd+K` opens global command palette (shadcn Command component) for quick actions: create item, switch view, search, run analysis.

### 11.2 Table View (List View)

Modeled after ClickUp's List View. The primary data exploration interface.

**Features:**
- TanStack Table with sortable, filterable, resizable columns
- Default columns: Drag handle | Checkbox | Title | Status | Priority | Assignee | Start Date | Due Date | Estimate | Tags
- Drag-and-drop row reordering via @dnd-kit with grab handles. Reorder persists `sort_order` to backend via `PATCH /api/nodes/{type}/reorder`
- Inline editing: click any cell to edit in-place. Status/priority/assignee render as colored badges and open dropdown selectors on click. Dates open date picker. Tags open multi-select with create-new option.
- Grouped rows: group by Status, Priority, Assignee, Epic, or Workstream. Each group header is collapsible with aggregate count and total estimate.
- Sub-rows: Issues nested under their Epic parents. Expand/collapse per parent.
- Bulk actions toolbar: appears when rows are selected (checkbox). Actions: change status, reassign, set priority, add tag, delete.
- Column visibility toggle: dropdown to show/hide columns.
- Quick-add row: "+" button at bottom of each group to add a new item inline.

**Mutation Flow:**
```
User drags row → @dnd-kit fires onDragEnd → compute new sort_order array
→ optimistic update via Zustand / TanStack Query
→ PATCH /api/nodes/Issue/reorder { ids: [...], sort_orders: [...] }
→ backend updates sort_order in Lance dataset
→ on success: cache matches optimistic state
→ on failure: rollback optimistic update, show toast error
```

### 11.3 Kanban Board View

Modeled after ClickUp's Board View. Visual workflow for status-based progression.

**Features:**
- Columns = Statuses (configurable in Settings). Each column shows cards with title, priority badge, assignee avatar, due date, tag chips, estimate.
- Drag cards between columns to change status. Uses @dnd-kit with `SortableContext` per column. Cross-column drag triggers `PUT /api/nodes/{type}/{id}` with new status.
- Drag cards within a column to reorder (`sort_order` update).
- Swimlanes (optional): toggle horizontal swimlanes by Assignee, Team, or Epic. Each lane is an independent scrollable row of Kanban columns.
- Card detail: click card → opens Right Detail Panel with full item detail.
- WIP limits: configurable per-column limits (set in Settings). Column header turns red when exceeded.
- Column header: shows count, total estimate, and progress bar (done/total).
- Quick-add: "+" at bottom of each column to create new item with that status pre-filled.
- Handoff visualization: cross-team cards show a small handoff icon. Hovering shows handoff details.

**Mutation Flow:**
```
User drags card from "In Progress" to "Review"
→ @dnd-kit onDragEnd fires
→ optimistic update: move card to new column in local state
→ PUT /api/nodes/Issue/{id} { status: "review" }
→ backend updates Lance dataset, re-embeds if description changed
→ confirm or rollback
```

### 11.4 Gantt Chart View

Modeled after ClickUp's Gantt View. Interactive timeline for scheduling and dependency management.

**Primary component:** SVAR React Gantt (MIT edition).

**Features:**
- Horizontal timeline with zoom levels: Day, Week, Month, Quarter
- Task bars positioned by `start_date` and `target_date`. Bar length = duration. Color-coded by status or priority (configurable).
- Drag bars to adjust start/end dates. On drop: `PUT /api/nodes/{type}/{id} { start_date, target_date }`
- Resize bar edges to extend/shorten duration.
- **Dependency arrows:** lines connecting dependent tasks. Draw new dependency by clicking a task's output connector dot and dragging to another task's input dot. On connect: `POST /api/edges/DEPENDS_ON { src_id, dst_id }`. Arrow types: finish-to-start (default), start-to-start, finish-to-finish.
- **Auto-reschedule:** when a task with dependents is moved, downstream tasks shift by the same delta. Uses `PATCH /api/nodes/{type}/reschedule { anchor_id, delta_days }`.
- **Critical path highlighting:** toggle to overlay the longest-path chain in red. Computed via `GET /api/analyze/critical-path/{milestone_id}`.
- Milestones: rendered as diamond markers on the timeline at their `target_date`.
- Left sidebar within Gantt: collapsible task list with hierarchy. Columns: Title, Assignee, Status. Drag to reorder within hierarchy.
- Today marker: vertical red line at current date.
- Slack time: toggle to show available buffer per task (difference between earliest finish and latest required start for dependents).
- Context menu: right-click any task bar for Edit, Add dependency, Remove dependency, Add subtask, Delete.

**Data Loading:**
```
GET /api/views/gantt?milestone=MS-Q2
→ Returns:
{
  tasks: [
    { id, title, start_date, target_date, status, assignee, parent_id, sort_order },
    ...
  ],
  dependencies: [
    { src_id, dst_id, type: "finish_to_start", lag_days },
    ...
  ],
  milestones: [
    { id, name, target_date },
    ...
  ]
}
```

### 11.5 Item Detail Panel

Slide-out right panel (shadcn Sheet) or full-page modal on small screens. ClickUp-style detailed view.

**Sections:**

**Title** — Large, inline-editable. Auto-saves on blur.

**Description** — Rich text editor (Tiptap or Kibo Editor). Supports markdown, headings, bullet lists, code blocks, checklists, @mentions of people/teams, #references to other items. Freeform content. Auto-saves with debounce (1s). Stored as markdown in the `description` field.

**Properties sidebar** (right column within panel):
- Status — dropdown, colored badges, configurable in Settings
- Priority — dropdown with icons (Urgent, High, Medium, Low, None)
- Assignee — avatar + name dropdown, populated from Settings > People
- Team — dropdown, populated from Settings > Teams
- Start Date / Due Date — date pickers
- Estimate — number input, days or points
- Risk Level — dropdown: low, medium, high, critical
- Tags — multi-select with create-new, populated from Settings > Tags, colored chips
- Application — dropdown, populated from Settings > Applications
- Parent — link to containing Epic/Feature

**Dependencies tab:**
- "Blocked by" list — items this task depends on
- "Blocking" list — items that depend on this task
- "+ Add dependency" button → search/select popup
- Each dependency shows: item title, status badge, team, and a "remove" button

**Handoffs tab:** Incoming/outgoing handoffs with SLA status

**Activity log:** Timestamped changes (status changes, reassignments, date shifts)

### 11.6 Settings Panel

Dedicated `/settings` route. ClickUp-style settings with left nav for categories.

**Teams:**
- CRUD for teams: name, color, capacity_points, lead
- Drag to reorder display order
- Each team shows member count and active workload summary

**People:**
- CRUD for people: name, email, team assignment, role
- Bulk import from CSV
- Avatar upload or Gravatar integration

**Applications / Systems:**
- CRUD: name, description, owner team, tech stack tags
- Used as filter/grouping dimension and in dependency analysis

**Feature Owners:**
- Map features to owner (Person). Separate from assignee — this is the accountable product owner.
- Displayed in Feature-level views

**Statuses:**
- Configurable status workflow: name, color, category (To Do / In Progress / Done / Blocked)
- Drag to reorder the Kanban column sequence
- Can create multiple status sets for different workstream types

**Priorities:**
- Configure priority levels: name, color, icon, numeric level
- Default: Urgent (1), High (2), Medium (3), Low (4), None (5)

**Tags:**
- CRUD: name, color, category
- Tags are global across all work item types
- Supports hierarchical tag groups (e.g., "Component: Auth", "Component: API")

**Handoff Types:**
- Configure: name, default SLA days, description
- Examples: Requirements, API Contract, QA Handoff, Release Gate

**Import/Export:**
- Import from JSON/CSV with field mapping UI
- Jira import adapter: paste Jira CSV export, map fields
- Export full project as JSON archive

All settings entities are stored as Lance graph nodes and available throughout the UI as dropdown/autocomplete options. Changes propagate immediately via TanStack Query cache invalidation.

### 11.7 Search

Global search bar in the top bar. Hybrid semantic + structural.

- Type-ahead with debounce (300ms)
- Results grouped by type: Issues, Epics, Features, Artifacts
- Each result shows: title, type badge, status, team, relevance score
- Scope selector: search within current view scope (e.g., "within Workstream: Auth") or globally
- Backend: `POST /api/search { query, scope_workstream, scope_milestone, filters: { status, team } }`
- Uses `VectorSearch` with cosine similarity + Cypher graph filter for scoped results

### 11.8 Analysis Views

Accessible from sidebar "Insights" section. Each analysis renders as a dedicated page.

- **Bottleneck Report:** Table of high fan-in/fan-out items. Bar chart of fan-in by workstream.
- **Critical Path:** Gantt-like view showing only critical-path items in red. List of items with their slack time.
- **Impact Analysis:** Input: select a task + slip days. Output: tree visualization of all downstream affected items with cascading date shifts.
- **Team Workload:** Stacked bar chart per team showing total estimate by status. Highlights overloaded teams (Recharts).
- **Handoff Hotspots:** Chord diagram or matrix showing cross-team handoff density.
- **Stale Blockers:** Table of unresolved dependencies older than threshold.

## 12. Frontend Project Structure

```
orchestration-ui/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx                      # App entry
│   ├── App.tsx                       # Router + layout shell
│   ├── api/
│   │   ├── client.ts                 # Axios/fetch instance
│   │   ├── nodes.ts                  # Node CRUD hooks (TanStack Query)
│   │   ├── edges.ts                  # Edge CRUD hooks
│   │   ├── search.ts                 # Search hooks
│   │   ├── analysis.ts               # Analysis hooks
│   │   ├── settings.ts               # Settings hooks
│   │   └── views.ts                  # View-specific data hooks
│   ├── stores/
│   │   ├── ui.ts                     # Zustand: active view, sidebar, filters
│   │   └── selection.ts              # Zustand: selected items, bulk actions
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── DetailPanel.tsx
│   │   │   └── CommandPalette.tsx
│   │   ├── views/
│   │   │   ├── TableView.tsx         # TanStack Table + dnd-kit
│   │   │   ├── KanbanView.tsx        # Kibo Kanban + dnd-kit
│   │   │   ├── GanttView.tsx         # SVAR Gantt wrapper
│   │   │   └── ViewSwitcher.tsx
│   │   ├── detail/
│   │   │   ├── ItemDetail.tsx
│   │   │   ├── DescriptionEditor.tsx # Tiptap rich text
│   │   │   ├── PropertiesSidebar.tsx
│   │   │   ├── DependencyList.tsx
│   │   │   └── ActivityLog.tsx
│   │   ├── settings/
│   │   │   ├── SettingsLayout.tsx
│   │   │   ├── TeamsSettings.tsx
│   │   │   ├── PeopleSettings.tsx
│   │   │   ├── StatusSettings.tsx
│   │   │   ├── PrioritySettings.tsx
│   │   │   ├── TagSettings.tsx
│   │   │   ├── ApplicationSettings.tsx
│   │   │   └── ImportExport.tsx
│   │   ├── analysis/
│   │   │   ├── BottleneckReport.tsx
│   │   │   ├── CriticalPath.tsx
│   │   │   ├── ImpactAnalysis.tsx
│   │   │   ├── TeamWorkload.tsx
│   │   │   └── HandoffHotspots.tsx
│   │   └── shared/
│   │       ├── StatusBadge.tsx
│   │       ├── PriorityBadge.tsx
│   │       ├── TagChip.tsx
│   │       ├── PersonAvatar.tsx
│   │       ├── SearchBar.tsx
│   │       └── ConfirmDialog.tsx
│   ├── hooks/
│   │   ├── useOptimisticMutation.ts
│   │   ├── useDragReorder.ts
│   │   └── useDebounce.ts
│   ├── lib/
│   │   ├── utils.ts                  # cn(), date helpers
│   │   └── schemas.ts               # Zod schemas for forms
│   └── types/
│       ├── nodes.ts                  # TypeScript interfaces for all node types
│       ├── edges.ts
│       └── api.ts                    # API response types
└── components/ui/                    # shadcn/ui generated components
    ├── button.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── command.tsx
    ├── badge.tsx
    ├── calendar.tsx
    ├── popover.tsx
    ├── tooltip.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── select.tsx
    ├── form.tsx
    ├── table.tsx
    ├── sheet.tsx
    ├── tabs.tsx
    └── toast.tsx
```

---

# Part IV: MCP Server & Agent Skills

## 13. MCP Server Architecture

The MCP server is implemented using **FastMCP** (v3.1+, the standard Python framework for MCP, downloaded over a million times per day) and exposes the orchestration engine as tools, resources, and prompts following the MCP 2025-11-25 specification.

### 13.1 Server Setup

```python
from fastmcp import FastMCP

mcp = FastMCP(
    "Orchestration Graph",
    instructions="""
    You are an AI assistant connected to a local project orchestration graph database.
    You can query project structure, dependencies, timelines, and team workloads.
    Use the available tools to answer questions about project status, identify risks,
    and help with planning. Always ground answers in actual graph data.
    """,
)
```

### 13.2 MCP Tools

Tools are model-controlled functions the AI agent can invoke:

**Read-Only Tools:**

```python
@mcp.tool(annotations={"readOnlyHint": True})
def search_items(query: str, scope_workstream: str | None = None,
                 scope_milestone: str | None = None, top_k: int = 10) -> list[dict]:
    """Semantic search across all work items.
    Returns title, id, type, status, team, relevance score."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_item(item_type: str, item_id: str) -> dict:
    """Get full details for a specific work item including
    properties, tags, and relationships."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_dependencies(item_id: str, direction: str = "both",
                     max_depth: int = 5) -> list[dict]:
    """Get upstream (blocked_by) and/or downstream (blocking) dependencies
    for an item, up to max_depth hops."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_items_by_filter(item_type: str = "Issue", status: str | None = None,
                        team: str | None = None, priority: int | None = None,
                        workstream: str | None = None, tags: list[str] | None = None,
                        limit: int = 50) -> list[dict]:
    """List work items matching the given filters.
    Returns id, title, status, priority, assignee, dates."""

@mcp.tool(annotations={"readOnlyHint": True})
def run_cypher_query(cypher: str) -> list[dict]:
    """Execute an arbitrary Cypher query against the project graph.
    Returns results as list of dicts."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_bottlenecks(workstream: str | None = None, top_k: int = 10) -> list[dict]:
    """Identify top bottleneck items by fan-in count,
    optionally scoped to a workstream."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_critical_path(milestone_id: str) -> dict:
    """Compute the approximate critical path for a milestone.
    Returns ordered list of items and total duration."""

@mcp.tool(annotations={"readOnlyHint": True})
def run_impact_analysis(item_id: str, slip_days: int) -> dict:
    """Analyze downstream impact if the given item slips by N days.
    Returns affected items, milestones, and teams."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_team_workload(team_id: str | None = None) -> list[dict]:
    """Get workload summary per team: total estimate, in-progress count,
    blocked count, capacity utilization."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_stale_blockers(threshold_days: int = 14) -> list[dict]:
    """List unresolved dependency blockers older than threshold_days."""

@mcp.tool(annotations={"readOnlyHint": True})
def get_handoff_hotspots() -> list[dict]:
    """Identify cross-team handoff hotspots ranked by frequency."""
```

**Write Tools:**

```python
@mcp.tool(annotations={"readOnlyHint": False})
def create_item(item_type: str, title: str, description: str = "",
                status: str = "todo", priority: int = 3,
                parent_id: str | None = None, assignee_id: str | None = None,
                team_id: str | None = None, start_date: str | None = None,
                target_date: str | None = None, estimate_days: float | None = None,
                tags: list[str] | None = None) -> dict:
    """Create a new work item. Returns the created item with generated ID."""

@mcp.tool(annotations={"readOnlyHint": False})
def update_item(item_type: str, item_id: str, **updates) -> dict:
    """Update properties of an existing work item.
    Pass only the fields to change."""

@mcp.tool(annotations={"readOnlyHint": False})
def link_dependency(src_id: str, dst_id: str, dependency_type: str = "technical",
                    lag_days: int = 0, reason: str = "") -> dict:
    """Create a DEPENDS_ON edge between two items. src depends on dst."""

@mcp.tool(annotations={"readOnlyHint": False})
def remove_dependency(src_id: str, dst_id: str) -> dict:
    """Remove a DEPENDS_ON edge between two items."""

@mcp.tool(annotations={"readOnlyHint": False})
def assign_item(item_id: str, person_id: str, role: str = "owner") -> dict:
    """Assign a person to a work item with a role."""
```

### 13.3 MCP Resources

Resources provide read-only context data that agents can reference:

```python
@mcp.resource("project://schema")
def get_schema() -> str:
    """Project graph schema: node types, edge types, properties, and allowed values."""

@mcp.resource("project://teams")
def get_teams() -> str:
    """List of all teams with their capacity and current workload summary."""

@mcp.resource("project://milestones")
def get_milestones() -> str:
    """List of all milestones with target dates and completion percentages."""

@mcp.resource("project://stats")
def get_project_stats() -> str:
    """Project-wide statistics: total items by type, status distribution, overdue count."""

@mcp.resource("project://settings/statuses")
def get_statuses() -> str:
    """Configured status workflow with categories and colors."""

@mcp.resource("project://settings/priorities")
def get_priorities() -> str:
    """Configured priority levels."""
```

### 13.4 MCP Prompts

Prompts provide reusable templates for common agent interactions:

```python
@mcp.prompt()
def analyze_risk(milestone_id: str) -> str:
    """Generate a risk analysis prompt for a specific milestone."""
    return f"""Analyze the delivery risk for milestone {milestone_id}.
    1. First, get the critical path using get_critical_path
    2. Check team workloads for teams involved using get_team_workload
    3. Look for stale blockers using get_stale_blockers
    4. Check handoff hotspots using get_handoff_hotspots
    5. Synthesize findings into a risk report with:
       - Overall risk level (Green/Yellow/Red)
       - Top 3 risks with mitigation suggestions
       - Items requiring immediate attention
    """

@mcp.prompt()
def plan_sprint(team_id: str, capacity_days: float) -> str:
    """Generate a sprint planning prompt for a team."""
    return f"""Help plan the next sprint for team {team_id} with {capacity_days} days of capacity.
    1. Get the team's current workload using get_team_workload
    2. Find unblocked items assigned to this team using get_items_by_filter
    3. Check dependencies to identify what can be parallelized
    4. Suggest a sprint scope that fits within capacity, prioritizing:
       - Items on critical paths
       - Items blocking other teams
       - High-priority items
    """

@mcp.prompt()
def dependency_report(workstream_id: str) -> str:
    """Generate a dependency analysis report for a workstream."""
    return f"""Create a dependency analysis report for workstream {workstream_id}.
    1. Find all items in this workstream
    2. Map their cross-workstream dependencies
    3. Identify circular dependencies (if any)
    4. List external blockers (dependencies on other workstreams)
    5. Highlight handoff risks
    Present as a structured report with actionable recommendations.
    """
```

### 13.5 MCP Transport Configuration

```python
if __name__ == "__main__":
    import sys
    transport = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    if transport == "http":
        mcp.run(transport="streamable-http", host="0.0.0.0", port=8001)
    else:
        mcp.run(transport="stdio")
```

**Claude Desktop configuration** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "orchestration-graph": {
      "command": "python",
      "args": ["-m", "orchestration_graph.mcp_server"],
      "env": {
        "PROJECT_ROOT": "/path/to/my-program"
      }
    }
  }
}
```

## 14. Agent SKILL.md

The following file is placed at the project root to guide AI agents (Claude Code, Cursor, etc.) on how to interact with the orchestration system:

````markdown
# SKILL.md — Orchestration Graph Agent Skills

## Overview
This project is a local graph-backed project orchestration system. Data is stored
as a typed property graph in Lance format. You can query it via Cypher through the
MCP tools or the REST API.

## Available MCP Tools

### Read-Only Queries
- `search_items(query, scope_workstream?, scope_milestone?, top_k?)` — Semantic search
- `get_item(item_type, item_id)` — Full item detail
- `get_dependencies(item_id, direction?, max_depth?)` — Dependency traversal
- `get_items_by_filter(item_type?, status?, team?, priority?, workstream?, tags?, limit?)` — Filtered list
- `run_cypher_query(cypher)` — Arbitrary Cypher (use for complex structural queries)
- `get_bottlenecks(workstream?, top_k?)` — Fan-in/fan-out analysis
- `get_critical_path(milestone_id)` — Critical path computation
- `run_impact_analysis(item_id, slip_days)` — Downstream impact
- `get_team_workload(team_id?)` — Capacity utilization
- `get_stale_blockers(threshold_days?)` — Aging blockers
- `get_handoff_hotspots()` — Cross-team handoff density

### Write Operations
- `create_item(item_type, title, ...)` — Create work item
- `update_item(item_type, item_id, **updates)` — Update item fields
- `link_dependency(src_id, dst_id, ...)` — Create dependency
- `remove_dependency(src_id, dst_id)` — Remove dependency
- `assign_item(item_id, person_id, role?)` — Assign person

### Resources (Read-Only Context)
- `project://schema` — Graph schema and allowed values
- `project://teams` — Team list with workload
- `project://milestones` — Milestones with status
- `project://stats` — Project-wide statistics
- `project://settings/statuses` — Status workflow config
- `project://settings/priorities` — Priority levels

## Node Types
Program, Workstream, Feature, Epic, Issue, Milestone, Team, Person, Application, Tag

## Edge Types
CONTAINS, DEPENDS_ON, ASSIGNED_TO, HANDOFF_TO, DELIVERS, RELATES_TO, TAGGED_WITH

## Common Cypher Patterns

### Transitive dependencies (what does item X depend on, any depth):
```cypher
MATCH (t:Issue {issue_id: $id})-[:DEPENDS_ON*1..8]->(dep)
RETURN dep.issue_id, dep.title, dep.status
```

### All items under a Feature (hierarchy traversal):
```cypher
MATCH (f:Feature {feature_id: $id})-[:CONTAINS*1..5]->(child)
RETURN child
```

### Cross-team dependencies:
```cypher
MATCH (a)-[:ASSIGNED_TO]->(t1:Team),
      (a)-[:DEPENDS_ON]->(b)-[:ASSIGNED_TO]->(t2:Team)
WHERE t1.team_id <> t2.team_id
RETURN t1.name, t2.name, a.title, b.title
```

### Blocked items per team:
```cypher
MATCH (t:Team)<-[:ASSIGNED_TO]-(item)-[:DEPENDS_ON]->(blocker)
WHERE blocker.status <> 'done'
RETURN t.name, item.title, blocker.title, blocker.status
```

## Best Practices
1. Always check `project://schema` first if unsure about field names
2. Use `get_items_by_filter` for simple listing; reserve `run_cypher_query` for complex structural queries
3. For impact analysis, always use `run_impact_analysis` rather than manual traversal
4. When creating items, check `project://settings/statuses` for valid status values
5. Ground all answers in actual query results — never fabricate item IDs or relationships
````

---

# Part V: Implementation Plan

## 15. Milestones

### M0: Design + Data Model (Weeks 1–2)
- Finalize schema.yaml format and all node/edge definitions
- Validate lance-graph Cypher capabilities against all query targets
- Produce example datasets with realistic dependency structures (500+ nodes)
- Set up monorepo structure: `backend/`, `frontend/`, `mcp/`
- Design API contract (OpenAPI spec)

### M1: Core Backend Engine (Weeks 3–6)
- CRUD layer with schema validation and auto-embedding
- Bulk import/export (JSON/CSV, Jira adapter)
- All graph queries operational
- Semantic search with brute-force and ANN index paths
- FastAPI service with all API endpoints
- Settings management (teams, people, statuses, priorities, tags)
- CLI for core operations

### M2: Frontend — Table & Kanban (Weeks 7–10)
- Vite + React + Tailwind + shadcn/ui project scaffold
- Global layout: sidebar, top bar, command palette
- Table View: TanStack Table + dnd-kit row reorder + inline editing
- Kanban View: Kibo Kanban + dnd-kit cross-column drag
- Item Detail Panel with rich text editor (Tiptap)
- Settings UI (all categories)
- Search bar with hybrid results
- TanStack Query integration with optimistic mutations

### M3: Frontend — Gantt & Analysis (Weeks 11–14)
- Gantt View: SVAR React Gantt with dependency arrows + drag scheduling
- Auto-reschedule on dependency chain moves
- Critical path overlay
- Analysis views: Bottleneck, Impact, Workload, Handoff Hotspots
- Team workload charts (Recharts)

### M4: MCP Server & Agent Layer (Weeks 15–17)
- FastMCP server implementation with all tools, resources, and prompts
- SKILL.md for agent guidance
- Claude Desktop integration testing
- Cursor / Claude Code integration testing
- MCP Tasks primitive for long-running analysis (experimental)

### M5: Packaging & Polish (Weeks 18–20)
- Project directory structure and backup/restore
- One-command startup script (`orchestrate start` → backend + frontend)
- Documentation and example "starter template" repository
- Performance testing and optimization
- End-to-end integration tests

## 16. Dependencies

### Backend
- `lance-graph` (v0.3.1+), `lancedb`, `pyarrow`, `lance`
- `fastapi`, `uvicorn`, `pydantic`
- `sentence-transformers` or `onnxruntime` (embedding)
- `networkx` (critical-path, cycle detection)
- `click` (CLI)
- `pyyaml` (schema config)
- `fastmcp` (v3.1+, MCP server)

### Frontend
- `react` (18+), `react-dom`, `react-router` (v7)
- `vite` (6+), `typescript`
- `tailwindcss` (4+), `shadcn/ui`
- `@tanstack/react-table` (v8), `@tanstack/react-query` (v5)
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `@svar-ui/react-gantt` (MIT)
- `@kibo-ui/kanban` (MIT, via shadcn CLI)
- `tiptap` (rich text editor)
- `zustand` (client state)
- `react-hook-form`, `zod` (forms)
- `recharts` (charts)
- `date-fns` (dates)
- `lucide-react` (icons)
- `axios` (HTTP client)

## 17. Risks and Mitigations

**lance-graph maturity (v0.3.1, 75 GitHub stars):** The Cypher subset needed (MATCH, WHERE, RETURN, variable-length paths, aggregation, ORDER BY, LIMIT) is well-tested. Pin to known-good version, contribute upstream fixes. Writes go through Python CRUD layer, not Cypher MERGE/CREATE.

**SVAR Gantt dependency arrows:** The MIT edition supports basic dependencies. If dependency drawing UX is insufficient, fall back to extending Kibo UI's Gantt composable with custom SVG arrow rendering via dnd-kit connectors.

**Kibo UI Kanban maturity:** Kibo UI is young (some users note it feels "raw"). Since Kibo copies source code into your project, we own the code and can extend/fix it directly. Worst case, build Kanban from dnd-kit + shadcn primitives.

**Cycle handling:** Real dependency graphs can contain cycles. Cycle detection runs as a pre-check before critical-path computation. Cycles surfaced as warnings in the UI and MCP tool responses.

**Date arithmetic in Cypher:** lance-graph may not support all date functions natively. Extract dates as properties, perform date arithmetic in the Python analysis layer.

**MCP specification evolution:** The MCP spec is evolving rapidly (2025-11-25 revision added Tasks, OAuth 2.1, extensions). Use FastMCP which abstracts protocol details, and stick to stable tool/resource/prompt primitives.

**Frontend performance at scale:** Gantt and Table views with 10K+ items may degrade. Mitigation: server-side pagination, virtual scrolling (TanStack Table supports this natively), and lazy-load Gantt tasks by viewport window.

## 18. Open Questions

1. **Gantt library selection:** SVAR React Gantt (MIT, free, good DX) vs. building custom on top of Kibo Gantt composable (more control, more work). Recommend: start with SVAR, evaluate after M3.

2. **Rich text storage:** Store descriptions as raw markdown in Lance string columns, or as structured JSON (Tiptap's native format)? Recommend: markdown for portability and embedding compatibility.

3. **Embedding model:** MiniLM-L6-v2 (384d, fast, 80MB) vs. BGE-small-en-v1.5 (384d, better quality). Recommend: configurable, default MiniLM.

4. **MCP Tasks primitive:** Should long-running analyses (full program impact analysis across all milestones) use the experimental Tasks primitive for async execution? Recommend: defer to M4 evaluation.

5. **Offline-first frontend:** Should the frontend cache data locally for offline viewing? Recommend: no for v1, TanStack Query's cache provides warm-start but not true offline.

6. **Multi-project support:** Should the system support multiple projects in a single instance? Recommend: v1 is single-project; v2 can add project switching via separate Lance directories.

---

*This document serves as the combined product requirements and technical specification for the Local Graph Project Orchestration DB. It is a living document to be updated as implementation progresses through the milestone phases.*
