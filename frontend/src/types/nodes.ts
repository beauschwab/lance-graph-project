export interface Issue {
  issue_id: string;
  title: string;
  status: string;
  priority: number;
}

export type NodeRecord = Record<string, unknown>;
