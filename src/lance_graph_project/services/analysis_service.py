from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime

from lance_graph_project.services.repository import JsonGraphRepository


class AnalysisService:
    def __init__(self, repo: JsonGraphRepository) -> None:
        self.repo = repo

    def get_bottlenecks(self, workstream: str | None = None, top_k: int = 10) -> list[dict]:
        inbound = defaultdict(int)
        for edge in self.repo.list_edges("DEPENDS_ON"):
            inbound[edge["dst_id"]] += 1

        issues = self.repo.list_nodes("Issue", filters={"workstream_id": workstream} if workstream else None).items
        items = sorted(
            [{"item_id": issue["issue_id"], "title": issue.get("title", ""), "fan_in": inbound[issue["issue_id"]]} for issue in issues],
            key=lambda row: row["fan_in"],
            reverse=True,
        )
        return items[:top_k]

    def get_critical_path(self, milestone_id: str) -> dict:
        delivers = [edge for edge in self.repo.list_edges("DELIVERS") if edge["milestone_id"] == milestone_id]
        item_ids = [edge["workitem_id"] for edge in delivers]
        nodes = []
        duration = 0.0
        for issue in self.repo.list_nodes("Issue").items:
            if issue["issue_id"] in item_ids:
                estimate = float(issue.get("estimate_days") or 0)
                duration += estimate
                nodes.append({"id": issue["issue_id"], "title": issue.get("title"), "estimate_days": estimate})
        return {"milestone_id": milestone_id, "path": nodes, "total_duration_days": duration}

    def run_impact_analysis(self, item_id: str, slip_days: int) -> dict:
        downstream = []
        frontier = [item_id]
        seen = {item_id}
        edges = self.repo.list_edges("DEPENDS_ON")
        while frontier:
            cur = frontier.pop()
            children = [edge["src_id"] for edge in edges if edge["dst_id"] == cur]
            for child in children:
                if child in seen:
                    continue
                seen.add(child)
                downstream.append(child)
                frontier.append(child)
        return {"item_id": item_id, "slip_days": slip_days, "impacted_item_ids": downstream}

    def get_team_workload(self, team_id: str | None = None) -> list[dict]:
        assigned = self.repo.list_edges("ASSIGNED_TO")
        people = {row["person_id"]: row for row in self.repo.list_nodes("Person").items}
        issues = {row["issue_id"]: row for row in self.repo.list_nodes("Issue").items}
        workload = defaultdict(lambda: {"total_estimate_days": 0.0, "item_count": 0, "blocked_count": 0})
        blockers = {edge["src_id"] for edge in self.repo.list_edges("DEPENDS_ON")}

        for rel in assigned:
            issue = issues.get(rel["src_id"])
            person = people.get(rel["dst_id"])
            if not issue or not person:
                continue
            if team_id and person.get("team_id") != team_id:
                continue
            team_key = person.get("team_id") or "unassigned"
            workload[team_key]["total_estimate_days"] += float(issue.get("estimate_days") or 0)
            workload[team_key]["item_count"] += 1
            if issue["issue_id"] in blockers:
                workload[team_key]["blocked_count"] += 1

        return [{"team_id": tid, **stats} for tid, stats in workload.items()]

    def get_stale_blockers(self, threshold_days: int = 14) -> list[dict]:
        stale = []
        now = datetime.now(UTC)
        for edge in self.repo.list_edges("DEPENDS_ON"):
            if edge.get("resolved_at"):
                continue
            created_at = edge.get("created_at")
            if created_at:
                try:
                    created = datetime.fromisoformat(created_at)
                    age_days = (now - created).days
                except (ValueError, TypeError):
                    age_days = 0
            else:
                age_days = 0
            if age_days >= threshold_days:
                stale.append({"src_id": edge["src_id"], "dst_id": edge["dst_id"], "age_days": age_days})
        return stale

    def get_handoff_hotspots(self) -> list[dict]:
        counts = defaultdict(int)
        for edge in self.repo.list_edges("HANDOFF_TO"):
            pair = (edge["src_id"], edge["dst_id"])
            counts[pair] += 1
        return [
            {"from_item": src, "to_item": dst, "handoff_count": count}
            for (src, dst), count in sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
        ]
