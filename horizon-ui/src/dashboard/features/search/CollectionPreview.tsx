import { useCollectionPrompts } from "./search.queries";

// The prompts of a found collection, loaded when it is opened.
export default function CollectionPreview({
  collectionId,
}: {
  collectionId: number;
}) {
  const { data, isPending, error } = useCollectionPrompts(collectionId);

  if (isPending) return <p className="text-xs">Loading…</p>;
  if (error) {
    return (
      <p role="alert" className="text-xs text-destructive">
        {error.message}
      </p>
    );
  }
  if (data.length === 0) return <p className="text-xs">No prompts yet.</p>;

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {data.map((prompt) => (
        <li key={String(prompt.promptId)}>
          <span className="me-2 text-xs opacity-70">{prompt.type}</span>
          {prompt.promptText}
        </li>
      ))}
    </ul>
  );
}
