# Lance Graph Project

Local-first project orchestration system with:

- FastAPI backend
- JSON-backed graph persistence (scaffold for Lance datasets)
- MCP server (FastMCP)
- React/Vite frontend scaffold

## Quickstart

1. Install dependencies:

```powershell
uv sync --extra backend --group dev
```

2. Run API server:

```powershell
uv run orchestrate serve
```

3. Run tests:

```powershell
uv run pytest -q
```

4. Seed local data:

```powershell
uv run python scripts/generate_seed_data.py
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` calls to `http://127.0.0.1:8000`.

## MCP Server

Run stdio transport:

```powershell
uv run python -m lance_graph_project.mcp_server
```

Run streamable HTTP transport:

```powershell
uv run python -m lance_graph_project.mcp_server http
```

## Current Status

- Core schema and models implemented
- CRUD/analysis/settings/search API endpoints implemented
- CLI and MCP scaffolding implemented
- Frontend scaffold implemented

