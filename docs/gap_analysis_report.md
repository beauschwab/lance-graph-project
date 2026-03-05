# PRD vs Implementation — Gap Analysis Report

**Date:** 2026-03-05
**PRD Version:** 0.2.0-draft (docs/prd_orchestration_db.md)
**Codebase SHA:** HEAD of `copilot/conduct-deep-code-review`

---

## Executive Summary

Deep code review of the implementation against the PRD. **67 new tests written** covering all backend API endpoints; **4 bugs found and fixed**; **5 POST endpoints added** to settings router. The backend is **feature-complete for core orchestration workflows**. The frontend has all PRD views implemented at a functional level but lacks UI polish. Several PRD features are deferred to future milestones.

---

## 1. Bugs Found & Fixed

### Bug 1: Soft-deleted nodes returned by `get_node()` (FIXED)
- **File:** `src/lance_graph_project/services/repository.py`
- **Impact:** `GET /api/nodes/{type}/{id}` returned 200 for soft-deleted items instead of 404
- **Root cause:** `get_node()` read directly from `_nodes` dict without checking `deleted_at`
- **Fix:** Added `deleted_at` filter in `get_node()`, extracted `_get_node_raw()` for internal use by `delete_node()`

### Bug 2: Test isolation failure — stale DI service caches (FIXED)
- **File:** `src/lance_graph_project/services/container.py`
- **Impact:** Tests that called `get_repository.cache_clear()` only cleared the repository cache, leaving service instances (NodeService, EdgeService, AnalysisService, etc.) holding references to the old repository
- **Root cause:** Each `@lru_cache(maxsize=1)` service factory was independently cached
- **Fix:** Added `clear_all_caches()` function that clears all 9 service factory caches; updated all test helpers to use it

### Bug 3: Extra fields silently accepted on node creation (FIXED)
- **File:** `src/lance_graph_project/services/repository.py`
- **Impact:** `POST /api/nodes/{type}` with unknown fields like `{"bogus_field": "nope"}` returned 200 instead of 400
- **Root cause:** `create_node()` filtered payload to only model fields BEFORE passing to Pydantic, so `extra="forbid"` never saw the unknown fields
- **Fix:** Added explicit check: `unknown = set(payload) - model_fields; if unknown: raise ValueError(...)`

### Bug 4: Stale blocker age hardcoded instead of computed (FIXED)
- **File:** `src/lance_graph_project/services/analysis_service.py`
- **Impact:** `GET /api/analyze/stale-blockers` returned ALL unresolved DEPENDS_ON edges with `age_days = threshold_days + 1` regardless of actual creation date
- **Root cause:** No date arithmetic was performed; every edge was marked as stale
- **Fix:** Parse `created_at` ISO timestamp, compute actual `(now - created).days`, only include edges where `age_days >= threshold_days`

### Bug 5 (minor): Unused variable in `delete_edge` (FIXED)
- **File:** `src/lance_graph_project/services/repository.py`
- **Impact:** Lint warning only
- **Fix:** Removed unused `rel` assignment

---

## 2. Missing Endpoints Added

### Settings CRUD POST endpoints (5 added)
The PRD §9.3 specifies POST endpoints for all settings entities. Only `POST /api/settings/teams` existed.

| Endpoint | Status |
|----------|--------|
| `POST /api/settings/teams` | ✅ Already existed |
| `POST /api/settings/people` | ✅ **Added** |
| `POST /api/settings/applications` | ✅ **Added** |
| `POST /api/settings/statuses` | ✅ **Added** |
| `POST /api/settings/priorities` | ✅ **Added** |
| `POST /api/settings/tags` | ✅ **Added** |

---

## 3. Test Coverage Added

**67 new tests** in `tests/test_prd_gap_analysis.py` organized into 14 test classes:

| Test Class | Tests | What it covers |
|------------|-------|----------------|
| `TestNodeCRUDAllTypes` | 13 | Create & read all 13 node types |
| `TestNodeUpdateDelete` | 6 | Update, soft-delete, filtered get, 404s |
| `TestEdgeCRUD` | 10 | Create all 7 edge types, list by src, delete |
| `TestCycleDetection` | 2 | Direct and transitive cycle rejection |
| `TestReorderAndTags` | 2 | sort_order reorder, tag add/remove |
| `TestAnalysisEndpoints` | 6 | Bottlenecks, critical-path, impact, workload, stale-blockers, handoffs |
| `TestViewsEndpoints` | 3 | Kanban grouping, Gantt data shape, Table typed query |
| `TestSettingsEndpoints` | 13 | All settings list/create/update endpoints |
| `TestSearch` | 2 | Text search matching, deleted item exclusion |
| `TestValidation` | 4 | Invalid risk_level, category, color, extra fields |
| `TestImportExport` | 2 | JSON export, unsupported format |
| `TestSystemEndpoints` | 2 | Health check, schema endpoint |
| `TestFullHierarchyWorkflow` | 1 | Program→Workstream→Feature→Epic→Issue + CONTAINS |
| `TestStaleBlockerBug` | 1 | Stale blocker age computed from created_at |

**Total:** 75 passing tests + 1 skipped (optional lance-graph dependency)

---

## 4. PRD Feature Coverage Matrix

### Backend API (PRD §9.3)

| PRD Endpoint | Implemented | Tested | Notes |
|-------------|:-----------:|:------:|-------|
| **Nodes** | | | |
| `GET /api/nodes/{type}` | ✅ | ✅ | Pagination, filtering, sorting |
| `POST /api/nodes/{type}` | ✅ | ✅ | Auto-embeds placeholder, auto-ID |
| `GET /api/nodes/{type}/{id}` | ✅ | ✅ | Now filters soft-deleted |
| `PUT /api/nodes/{type}/{id}` | ✅ | ✅ | Partial update, re-validates |
| `DELETE /api/nodes/{type}/{id}` | ✅ | ✅ | Soft delete with deleted_at |
| `PATCH /api/nodes/{type}/reorder` | ✅ | ✅ | Batch sort_order update |
| `PATCH /api/nodes/{type}/{id}/tags` | ✅ | ✅ | Add/remove tag lists |
| `PATCH /api/nodes/{type}/reschedule` | ✅ | ❌ | Exists but minimally implemented (stores delta, no cascade) |
| **Edges** | | | |
| `POST /api/edges/{type}` | ✅ | ✅ | Cycle detection for DEPENDS_ON |
| `GET /api/edges/{type}` | ✅ | ✅ | Filter by src_id/dst_id |
| `DELETE /api/edges/{type}/{src}/{dst}` | ✅ | ✅ | |
| **Query** | | | |
| `POST /api/query` | ✅ | ✅ | Falls back to JSON when lance-graph unavailable |
| `POST /api/search` | ✅ | ✅ | Regex-based text search (not vector yet) |
| **Analysis** | | | |
| `GET /api/analyze/bottlenecks` | ✅ | ✅ | Fan-in count per Issue |
| `GET /api/analyze/critical-path/{id}` | ✅ | ✅ | Sum of estimate_days for DELIVERS edges |
| `POST /api/analyze/impact` | ✅ | ✅ | BFS downstream traversal |
| `GET /api/analyze/workload` | ✅ | ✅ | Aggregate estimates by team |
| `GET /api/analyze/handoff-hotspots` | ✅ | ✅ | HANDOFF_TO frequency |
| `GET /api/analyze/stale-blockers` | ✅ | ✅ | Now uses real date math |
| **Settings** | | | |
| `GET/POST /api/settings/teams` | ✅ | ✅ | |
| `PUT /api/settings/teams/{id}` | ✅ | ✅ | |
| `GET/POST /api/settings/people` | ✅ | ✅ | POST added |
| `GET/POST /api/settings/applications` | ✅ | ✅ | POST added |
| `GET/POST /api/settings/statuses` | ✅ | ✅ | POST added |
| `GET/POST /api/settings/priorities` | ✅ | ✅ | POST added |
| `GET/POST /api/settings/tags` | ✅ | ✅ | POST added |
| `PUT /api/settings/{entity}/{id}` | ✅ | ✅ | Generic update |
| **Views** | | | |
| `GET /api/views/kanban` | ✅ | ✅ | Group by status or custom field |
| `GET /api/views/gantt` | ✅ | ✅ | Tasks + dependencies + milestones |
| `GET /api/views/table` | ✅ | ✅ | Typed node listing |
| **Import/Export** | | | |
| `POST /api/import` | ✅ | ❌ | JSON and CSV support present |
| `GET /api/export` | ✅ | ✅ | JSON export only |
| **System** | | | |
| `GET /api/health` | ✅ | ✅ | |
| `GET /api/schema` | ✅ | ✅ | |

### Data Model (PRD §8)

| Node Type | Model | Schema | Tests |
|-----------|:-----:|:------:|:-----:|
| Program | ✅ | ✅ | ✅ |
| Workstream | ✅ | ✅ | ✅ |
| Feature | ✅ | ✅ | ✅ |
| Epic | ✅ | ✅ | ✅ |
| Issue | ✅ | ✅ | ✅ |
| Milestone | ✅ | ✅ | ✅ |
| Team | ✅ | ✅ | ✅ |
| Person | ✅ | ✅ | ✅ |
| Application | ✅ | ✅ | ✅ |
| Artifact | ✅ | ✅ | ✅ |
| Tag | ✅ | ✅ | ✅ |
| StatusConfig | ✅ | ✅ | ✅ |
| PriorityConfig | ✅ | ✅ | ✅ |

| Edge Type | Model | Schema | Tests |
|-----------|:-----:|:------:|:-----:|
| CONTAINS | ✅ | ✅ | ✅ |
| DEPENDS_ON | ✅ | ✅ | ✅ |
| ASSIGNED_TO | ✅ | ✅ | ✅ |
| HANDOFF_TO | ✅ | ✅ | ✅ |
| DELIVERS | ✅ | ✅ | ✅ |
| RELATES_TO | ✅ | ✅ | ✅ |
| TAGGED_WITH | ✅ | ✅ | ✅ |

### MCP Server (PRD §13)

| Component | PRD | Implemented |
|-----------|:---:|:-----------:|
| **Tools (Read-Only)** | | |
| search_items | ✅ | ✅ |
| get_item | ✅ | ✅ |
| get_dependencies | ✅ | ✅ |
| get_items_by_filter | ✅ | ✅ |
| run_cypher_query | ✅ | ✅ |
| get_bottlenecks | ✅ | ✅ |
| get_critical_path | ✅ | ✅ |
| run_impact_analysis | ✅ | ✅ |
| get_team_workload | ✅ | ✅ |
| get_stale_blockers | ✅ | ✅ |
| get_handoff_hotspots | ✅ | ✅ |
| **Tools (Write)** | | |
| create_item | ✅ | ✅ |
| update_item | ✅ | ✅ |
| link_dependency | ✅ | ✅ |
| remove_dependency | ✅ | ✅ |
| assign_item | ✅ | ✅ |
| **Resources** | | |
| project://schema | ✅ | ✅ |
| project://teams | ✅ | ✅ |
| project://milestones | ✅ | ✅ |
| project://stats | ✅ | ✅ |
| project://settings/statuses | ✅ | ✅ |
| project://settings/priorities | ✅ | ✅ |
| **Prompts** | | |
| analyze_risk | ✅ | ✅ |
| plan_sprint | ✅ | ✅ |
| dependency_report | ✅ | ✅ |

### Frontend (PRD §11)

| View/Feature | Implemented | Notes |
|-------------|:-----------:|-------|
| **Global Layout** | ✅ | Sidebar, TopBar, DetailPanel, CommandPalette |
| **Table View** | ✅ | dnd-kit reorder, inline editing, search |
| **Kanban Board** | ✅ | Cross-column drag-drop, status grouping |
| **Gantt Chart** | ✅ | SVG dependency connectors, date shifting |
| **Item Detail Panel** | ✅ | Description editor, dependencies, activity, properties |
| **Settings Panel** | ✅ | 7 settings sections (Teams, People, Apps, Statuses, Priorities, Tags, Import/Export) |
| **Analysis Views** | ✅ | Bottleneck, Critical Path, Impact, Workload, Stale Blockers, Handoff Hotspots |
| **Command Palette** | ✅ | Cmd+K trigger, search and navigate |
| **Search** | ✅ | Text search via /search endpoint |
| **View Switcher** | ✅ | Table / Kanban / Gantt |

---

## 5. Known Gaps & Deferred Items

### Backend Gaps

| Gap | PRD Section | Severity | Status |
|-----|------------|----------|--------|
| **Vector embeddings not populated** | §8.4 | Medium | Embedding pipeline exists (`embeddings.py`) but is not invoked on create/update. Fields defined in models. |
| **No Lance persistence** | §9.5 | Medium | `ProjectStore` class exists but unused; data persisted as flat JSON files in `.orchestrate_data/` |
| **No Cypher query engine** | §7 | Medium | Cypher queries fall back to raw snapshot JSON when `lance-graph` is not installed. The adapter is written but the dependency is optional. |
| **Reschedule cascade not implemented** | §11.4 | Low | `PATCH /api/nodes/{type}/reschedule` stores delta but doesn't propagate to dependents |
| **No delete cascading** | — | Low | Deleting a node doesn't clean up related edges |
| **No edge-to-node validation** | — | Low | Can create edges referencing nonexistent node IDs |
| **Import CSV not tested** | §9.3 | Low | Endpoint exists but no test coverage for CSV import path |
| **No Jira import adapter** | §11.6 | Low | PRD mentions Jira CSV field mapping; not implemented |

### Frontend Gaps

| Gap | PRD Section | Severity | Notes |
|-----|------------|----------|-------|
| **No TanStack Table** | §10, §11.2 | Medium | Uses plain `<table>` elements instead of TanStack Table headless library |
| **No rich text editor** | §11.5 | Medium | Uses basic `<textarea>` instead of Tiptap/Kibo Editor |
| **No Tailwind/shadcn styling** | §10 | Medium | All components use inline styles, no utility CSS framework |
| **No SVAR Gantt** | §11.4 | Medium | Custom SVG Gantt implementation instead of SVAR React Gantt |
| **No Kibo UI Kanban** | §11.3 | Low | Custom Kanban built with dnd-kit primitives |
| **No React Hook Form / Zod** | §10 | Low | Settings forms use uncontrolled inputs |
| **No Recharts** | §10 | Low | Analysis views are tables only, no charts |
| **Type safety** | — | Low | Heavy use of `Record<string, unknown>` instead of strict TS interfaces |
| **Test coverage** | — | Low | Only 2 frontend tests (TableView, GanttView) |

### Architecture Gaps

| Gap | Notes |
|-----|-------|
| **JSON scalability** | Entire dataset loaded into memory; no streaming. Fine for <10K nodes but won't meet PRD's 10K target for p95 < 50ms |
| **Concurrency** | No file locking; concurrent writes could corrupt data |
| **No backup/restore** | PRD §9.5 mentions backups/ directory; not implemented |
| **No project.meta.json** | PRD §9.5 layout not followed exactly |

---

## 6. Recommendations

### High Priority (should address before M2)
1. **Integrate embedding pipeline** — Call `EmbeddingPipeline.embed_work_item_text()` in `create_node`/`update_node` for node types with `embedding` field
2. **Migrate to Lance persistence** — The `ProjectStore` scaffolding exists; wire it to replace JSON files for production use
3. **Add edge-to-node validation** — Verify `src_id`/`dst_id` reference real nodes before creating edges

### Medium Priority (address in M2-M3)
4. **Frontend UI framework** — Add Tailwind + shadcn/ui for consistent styling
5. **Replace textarea with Tiptap** — Rich text editing for descriptions
6. **Adopt TanStack Table** — Headless table for sorting/filtering/pagination
7. **Add CSV import tests** — Cover the existing import_csv code path

### Low Priority (address in M4-M5)
8. **Add Recharts** — Visualization for workload, burndown
9. **Implement reschedule cascade** — When anchor moves, shift downstream dependents
10. **Add backup/restore** — Archive `.orchestrate_data/` snapshots
11. **Expand frontend test coverage** — Settings, analysis, detail panel tests

---

*Report generated by automated code review against PRD. All bugs referenced have been fixed and tests pass.*
