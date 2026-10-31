import type { LocalCollection } from "../collections/collection.schema";
import type { LocalPrompt } from "../prompts/prompt.schema";
import type { Library, LibraryFile } from "./library.schema";

const key = (...parts: string[]) =>
  parts.map((part) => part.trim().toLowerCase()).join("\0");

export interface Duplicates {
  collections: string[];
  prompts: string[];
}

// What an import would double up, as ids from the file: collections by name,
// and prompts without a collection by text and type within the collection
// they are imported into.
export function findDuplicates(
  library: Library,
  file: LibraryFile,
  targetId: string | undefined,
): Duplicates {
  const names = new Set(library.collections.map((c) => key(c.name)));
  const prompts = new Set(
    library.prompts
      .filter((p) => p.collectionId === targetId)
      .map((p) => key(p.promptText, p.type)),
  );
  return {
    collections: file.collections
      .filter((c) => names.has(key(c.name)))
      .map((c) => c.id),
    prompts: file.prompts
      .filter(
        (p) =>
          p.collectionId === undefined &&
          prompts.has(key(p.promptText, p.type)),
      )
      .map((p) => p.id),
  };
}

// Everything is added under fresh ids, so an import can never clash with
// existing items. Prompts without a collection join the target. Skipping a
// collection skips its prompts too.
export function mergeLibrary(
  library: Library,
  file: LibraryFile,
  targetId: string | undefined,
  skipDuplicates: boolean,
): Library {
  const duplicates = skipDuplicates
    ? findDuplicates(library, file, targetId)
    : { collections: [], prompts: [] };
  const skippedCollections = new Set(duplicates.collections);
  const skippedPrompts = new Set(duplicates.prompts);
  const newIds = new Map<string, string>();

  const collections = file.collections
    .filter((c) => !skippedCollections.has(c.id))
    .map((c): LocalCollection => {
      const id = crypto.randomUUID();
      newIds.set(c.id, id);
      return { ...c, id, public: false };
    });
  const prompts = file.prompts
    .filter(
      (p) =>
        !skippedPrompts.has(p.id) &&
        !(
          p.collectionId !== undefined && skippedCollections.has(p.collectionId)
        ),
    )
    .map((p): LocalPrompt => ({
      ...p,
      id: crypto.randomUUID(),
      collectionId:
        p.collectionId === undefined ? targetId : newIds.get(p.collectionId),
      public: false,
    }));

  return {
    ...library,
    collections: [...library.collections, ...collections],
    prompts: [...library.prompts, ...prompts],
  };
}
