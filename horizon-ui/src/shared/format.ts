export const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// "2 collections and 5 prompts", leaving out whichever there are none of.
export const describeCounts = ({
  collections,
  prompts,
}: {
  collections: number;
  prompts: number;
}) =>
  [
    collections > 0 && plural(collections, "collection"),
    prompts > 0 && plural(prompts, "prompt"),
  ]
    .filter(Boolean)
    .join(" and ");
