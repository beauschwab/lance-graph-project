import { useEffect, useState } from "react";

import { listApplications } from "../../api/settings";

type Application = { app_id: string; name: string; owner_team_id?: string | null };

export function ApplicationSettings() {
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    void listApplications().then((rows) => setApps(rows as Application[]));
  }, []);

  return (
    <section>
      <h3>Applications</h3>
      <ul>
        {apps.map((app) => (
          <li key={app.app_id}>
            {app.name} {app.owner_team_id ? `owner: ${app.owner_team_id}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
