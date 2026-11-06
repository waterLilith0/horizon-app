export const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// A name with the id the item has on the server, when it has one.
export const withId = (name: string, id: number | string | undefined) =>
  id === undefined ? name : `${name} (${id})`;

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
