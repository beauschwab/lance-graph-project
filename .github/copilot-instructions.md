# Copilot Instructions

## Project Overview

Lance Graph Project is a **local-first project orchestration system** that manages work items and their relationships as a graph. It supports a hierarchy of Programs → Workstreams → Features → Epics → Issues, with typed relationships (dependencies, handoffs, assignments, containment). It provides multi-view analysis (table, Kanban, Gantt, critical path, bottleneck detection, workload heatmaps) and semantic search via vector embeddings.

## Tech Stack

- **Backend:** Python 3.12+ / FastAPI / Pydantic 2 / Uvicorn
- **Frontend:** TypeScript 5.9 / React 19 / Vite 7 / Zustand / TanStack React Query / React Router
- **Storage:** JSON file persistence + LanceDB for vector embeddings
- **Graph analysis:** NetworkX
- **Embeddings:** SentenceTransformers (384-dim)
- **MCP:** FastMCP for tool integration
- **CLI:** Click
- **Package management:** uv (Python), npm (frontend)

## Architecture

### Backend (`src/lance_graph_project/`)

- **API layer** (`api/routers/`): FastAPI routers for nodes, edges, queries, analysis, settings, views, import/export, system
- **Service layer** (`services/`): Business logic — NodeService, EdgeService, QueryService, SearchService, AnalysisService, SettingsService, SchemaService, ImportExportService
- **DI container** (`services/container.py`): `@lru_cache(maxsize=1)` singleton factory functions for all services
- **Models** (`models/`): Pydantic models with `ConfigDict(extra="forbid")` — node types (Program, Workstream, Feature, Epic, Issue, etc.) and edge types (Contains, DependsOn, AssignedTo, HandoffTo, etc.)
- **Storage** (`storage/`): Repository pattern with JSON persistence
- **MCP server** (`mcp_server.py`): FastMCP-based tool server (stdio and HTTP transport)

### Frontend (`frontend/src/`)

- **Components** organized by domain: `analysis/`, `detail/`, `layout/`, `settings/`, `shared/`, `views/`
- **API layer** (`api/`): Axios-based typed HTTP clients per domain
- **Hooks** (`hooks/`): React Query wrappers — `useNodes`, `useEdges`, `useSearch`, `useSelection`, `useKeyboardShortcuts`
- **Stores** (`stores/`): Zustand — `ui.ts` (view state), `selection.ts` (selected item)
- **Types** (`types/`): Shared TypeScript interfaces matching backend schemas

## Coding Conventions

### Python

- Use `from __future__ import annotations` in all modules
- Type hints on all function signatures (Python 3.12+ syntax)
- Pydantic `BaseModel` with `ConfigDict(extra="forbid")` for strict validation
- Snake_case for functions, variables, files; PascalCase for classes
- `_id` suffix for primary keys (e.g., `program_id`, `issue_id`)
- Async handlers in FastAPI (`async def`)
- Absolute imports from `lance_graph_project`
- `@field_validator` for custom validation logic

### TypeScript

- Strict mode (`strict: true`)
- PascalCase for components, interfaces, types; camelCase for functions, variables, hooks
- Functional React components with hooks only (no class components)
- Zustand for client state, React Query for server state
- Hook names start with `use`
- Prefer component composition over prop drilling

## Common Commands

```powershell
# Backend
uv sync --extra backend --group dev    # Install dependencies
uv run orchestrate serve               # Start API server (port 8000)
uv run pytest -q                       # Run backend tests

# Frontend
cd frontend
npm install                            # Install dependencies
npm run dev                            # Dev server (port 5173, proxies /api → backend)
npm run build                          # Production build
npm run test                           # Run frontend tests

# Data
uv run python scripts/generate_seed_data.py   # Seed sample data

# MCP
uv run python -m lance_graph_project.mcp_server        # stdio transport
uv run python -m lance_graph_project.mcp_server http    # HTTP transport
```

## Testing

- **Backend:** pytest + pytest-asyncio; tests in `tests/` (API CRUD, system, e2e workflow, CLI, graph config)
- **Frontend:** Vitest + React Testing Library; setup in `frontend/src/test/setup.ts`
- Write integration-style tests focused on user behavior (React Testing Library philosophy)

## Key Files

- `schema.yaml` — Defines valid node types, edge types, and their constraints
- `pyproject.toml` — Python project config, dependencies, CLI entry points
- `frontend/vite.config.ts` — Vite config with API proxy to backend
- `src/lance_graph_project/services/container.py` — DI container (service wiring)
- `src/lance_graph_project/models/nodes.py` — All node type models
- `src/lance_graph_project/models/edges.py` — All edge type models
