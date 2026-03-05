import { useEffect, useState } from "react";

import { createTeam, listTeams } from "../../api/settings";

type Team = { team_id: string; name: string; capacity_points?: number | null; lead_name?: string | null };

export function TeamsSettings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");

  async function load() {
    setTeams((await listTeams()) as Team[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate() {
    if (!name.trim()) return;
    await createTeam({ name, capacity_points: 40, lead_name: "TBD" });
    setName("");
    await load();
  }

  return (
    <section>
      <h3>Teams</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="New team name" />
        <button type="button" onClick={() => void onCreate()}>
          Add Team
        </button>
      </div>
      <ul>
        {teams.map((team) => (
          <li key={team.team_id}>
            {team.name} ({team.capacity_points ?? 0} capacity)
          </li>
        ))}
      </ul>
    </section>
  );
}
