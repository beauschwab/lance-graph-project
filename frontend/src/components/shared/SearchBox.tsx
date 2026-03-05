type SearchBoxProps = { query: string; onChange: (value: string) => void };

export function SearchBox({ query, onChange }: SearchBoxProps) {
  return <input value={query} onChange={(event) => onChange(event.target.value)} />;
}
