from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class NodeUpsertRequest(BaseModel):
    data: dict[str, Any]


class ReorderRequest(BaseModel):
    items: list[dict[str, Any]] = Field(default_factory=list)


class TagPatchRequest(BaseModel):
    add_tags: list[str] = Field(default_factory=list)
    remove_tags: list[str] = Field(default_factory=list)


class EdgeCreateRequest(BaseModel):
    data: dict[str, Any]


class QueryRequest(BaseModel):
    cypher: str
    params: dict[str, Any] = Field(default_factory=dict)


class SearchRequest(BaseModel):
    query: str
    scope_workstream: str | None = None
    scope_milestone: str | None = None
    top_k: int = 10
    filters: dict[str, Any] = Field(default_factory=dict)


class ImpactRequest(BaseModel):
    item_id: str
    slip_days: int


class ImportRequest(BaseModel):
    file_path: str
    node_type: str | None = None
    format: str = "json"
