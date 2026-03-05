import { useEffect, useState } from "react";

import { listTags } from "../../api/settings";

type TagItem = { tag_id: string; name: string; category?: string | null };

export function TagSettings() {
  const [tags, setTags] = useState<TagItem[]>([]);

  useEffect(() => {
    void listTags().then((rows) => setTags(rows as TagItem[]));
  }, []);

  return (
    <section>
      <h3>Tags</h3>
      <ul>
        {tags.map((tag) => (
          <li key={tag.tag_id}>
            {tag.name} {tag.category ? `(${tag.category})` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
