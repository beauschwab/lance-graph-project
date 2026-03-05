import { useEffect, useState } from "react";

import { listPeople } from "../../api/settings";

type Person = { person_id: string; name: string; email?: string | null; team_id?: string | null };

export function PeopleSettings() {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    void listPeople().then((rows) => setPeople(rows as Person[]));
  }, []);

  return (
    <section>
      <h3>People</h3>
      <ul>
        {people.map((person) => (
          <li key={person.person_id}>
            {person.name} {person.email ? `(${person.email})` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
