from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class EdgeBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Contains(EdgeBase):
    src_id: str
    dst_id: str
    container_type: str
    created_at: str | None = None


class DependsOn(EdgeBase):
    src_id: str
    dst_id: str
    dependency_type: str = "technical"
    lag_days: int = 0
    reason: str = ""
    created_at: str | None = None
    resolved_at: str | None = None


class AssignedTo(EdgeBase):
    src_id: str
    dst_id: str
    role: str = "owner"
    assigned_at: str | None = None


class HandoffTo(EdgeBase):
    src_id: str
    dst_id: str
    handoff_type: str
    sla_days: int = 0
    due_date: str | None = None
    status: str | None = None
    created_at: str | None = None


class Delivers(EdgeBase):
    milestone_id: str
    workitem_id: str
    commitment_level: str


class RelatesTo(EdgeBase):
    artifact_id: str
    workitem_id: str
    relation_type: str


class TaggedWith(EdgeBase):
    workitem_id: str
    tag_id: str
    tagged_at: str | None = None


EDGE_MODELS: dict[str, type[BaseModel]] = {
    "CONTAINS": Contains,
    "DEPENDS_ON": DependsOn,
    "ASSIGNED_TO": AssignedTo,
    "HANDOFF_TO": HandoffTo,
    "DELIVERS": Delivers,
    "RELATES_TO": RelatesTo,
    "TAGGED_WITH": TaggedWith,
}
