from __future__ import annotations

from random import choice, randint

from lance_graph_project.services.container import get_edge_service, get_node_service


def main() -> None:
    node_service = get_node_service()
    edge_service = get_edge_service()

    team_ids = []
    for idx in range(1, 7):
        team = node_service.create_node("Team", {"name": f"Team {idx}", "capacity_points": 50, "lead_name": f"Lead {idx}", "color": "#3b82f6"})
        team_ids.append(team["team_id"])

    workstream_ids = []
    program = node_service.create_node("Program", {"name": "Seed Program", "description": "Generated seed program"})
    for idx in range(1, 4):
        ws = node_service.create_node("Workstream", {"name": f"Workstream {idx}", "description": "Generated", "program_id": program["program_id"], "owner_team_id": choice(team_ids)})
        workstream_ids.append(ws["workstream_id"])

    milestone = node_service.create_node("Milestone", {"name": "M1", "description": "Seed milestone", "status": "todo"})

    issue_ids = []
    for i in range(1, 201):
        issue = node_service.create_node(
            "Issue",
            {
                "title": f"Issue {i}",
                "description": "Seed issue",
                "status": choice(["todo", "in_progress", "done", "blocked"]),
                "priority": randint(1, 5),
                "epic_id": f"EPC-{(i % 40) + 1}",
                "estimate_days": float(randint(1, 10)),
                "sort_order": i,
                "tags": ["seed"],
            },
        )
        issue_ids.append(issue["issue_id"])

    for src in issue_ids[1:120]:
        dst = choice(issue_ids[:80])
        if src == dst:
            continue
        try:
            edge_service.create_edge("DEPENDS_ON", {"src_id": src, "dst_id": dst, "dependency_type": "technical", "lag_days": 0, "reason": "seed"})
        except ValueError:
            pass

    for issue_id in issue_ids[:50]:
        edge_service.create_edge("DELIVERS", {"milestone_id": milestone["milestone_id"], "workitem_id": issue_id, "commitment_level": "must_have"})

    print(f"Seeded {len(issue_ids)} issues across {len(workstream_ids)} workstreams")


if __name__ == "__main__":
    main()
