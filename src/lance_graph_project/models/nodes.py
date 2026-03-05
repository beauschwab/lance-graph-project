from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NodeBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Program(NodeBase):
    program_id: str
    name: str
    description: str = ""
    status: str = "todo"
    start_date: str | None = None
    target_date: str | None = None
    embedding: list[float] | None = None


class Workstream(NodeBase):
    workstream_id: str
    name: str
    description: str = ""
    status: str = "todo"
    program_id: str
    owner_team_id: str | None = None
    embedding: list[float] | None = None


class Feature(NodeBase):
    feature_id: str
    title: str
    description: str = ""
    status: str = "todo"
    priority: int = 3
    workstream_id: str
    tags: list[str] = Field(default_factory=list)
    embedding: list[float] | None = None


class Epic(NodeBase):
    epic_id: str
    title: str
    description: str = ""
    status: str = "todo"
    priority: int = 3
    feature_id: str
    estimate_days: float | None = None
    start_date: str | None = None
    target_date: str | None = None
    tags: list[str] = Field(default_factory=list)
    embedding: list[float] | None = None


class Issue(NodeBase):
    issue_id: str
    title: str
    description: str = ""
    status: str = "todo"
    priority: int = 3
    epic_id: str
    estimate_days: float | None = None
    start_date: str | None = None
    target_date: str | None = None
    actual_date: str | None = None
    risk_level: Literal["low", "medium", "high", "critical"] | None = None
    tags: list[str] = Field(default_factory=list)
    sort_order: int = 0
    embedding: list[float] | None = None


class Milestone(NodeBase):
    milestone_id: str
    name: str
    description: str = ""
    target_date: str | None = None
    status: str = "todo"
    embedding: list[float] | None = None


class Team(NodeBase):
    team_id: str
    name: str
    capacity_points: int | None = None
    lead_name: str | None = None
    color: str | None = None

    @field_validator("color")
    @classmethod
    def validate_hex_color(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value.startswith("#") and len(value) in (4, 7):
            return value
        raise ValueError("color must be a hex string like #3b82f6")


class Person(NodeBase):
    person_id: str
    name: str
    email: str | None = None
    team_id: str | None = None
    role: str | None = None
    avatar_url: str | None = None


class Application(NodeBase):
    app_id: str
    name: str
    description: str = ""
    owner_team_id: str | None = None
    tech_stack: list[str] = Field(default_factory=list)


class Artifact(NodeBase):
    artifact_id: str
    title: str
    content_summary: str = ""
    url: str | None = None
    artifact_type: str | None = None
    embedding: list[float] | None = None


class Tag(NodeBase):
    tag_id: str
    name: str
    color: str | None = None
    category: str | None = None

    @field_validator("color")
    @classmethod
    def validate_hex_color(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value.startswith("#") and len(value) in (4, 7):
            return value
        raise ValueError("color must be a hex string like #10b981")


class StatusConfig(NodeBase):
    status_id: str
    name: str
    color: str | None = None
    category: Literal["todo", "in_progress", "done", "blocked"]
    sort_order: int = 0


class PriorityConfig(NodeBase):
    priority_id: str
    name: str
    color: str | None = None
    level: int
    icon: str | None = None


NODE_MODELS: dict[str, type[BaseModel]] = {
    "Program": Program,
    "Workstream": Workstream,
    "Feature": Feature,
    "Epic": Epic,
    "Issue": Issue,
    "Milestone": Milestone,
    "Team": Team,
    "Person": Person,
    "Application": Application,
    "Artifact": Artifact,
    "Tag": Tag,
    "StatusConfig": StatusConfig,
    "PriorityConfig": PriorityConfig,
}
