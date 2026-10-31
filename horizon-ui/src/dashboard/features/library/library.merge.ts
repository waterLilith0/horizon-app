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
// they are imported into, or among those in no collection.
export function findDuplicates(
  library: Library,
  file: LibraryFile,
  targetId: string | undefined,
): Duplicates {
  const names = new Set(library.collections.map((c) => key(c.name)));
  const prompts = new Set(
    library.prompts
      .filter((p) =>
        targetId === undefined
          ? p.collectionIds.length === 0
          : p.collectionIds.includes(targetId),
      )
      .map((p) => key(p.promptText, p.type)),
  );
  return {
    collections: file.collections
      .filter((c) => names.has(key(c.name)))
      .map((c) => c.id),
    prompts: file.prompts
      .filter(
        (p) =>
          p.collectionIds.length === 0 &&
          prompts.has(key(p.promptText, p.type)),
      )
      .map((p) => p.id),
  };
}

// Everything is added under fresh ids, so an import can never clash with
// existing items. Prompts without a collection join the target. Skipping a
// collection skips the prompts that are in no other collection of the file.
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
          p.collectionIds.length > 0 &&
          p.collectionIds.every((id) => skippedCollections.has(id))
        ),
    )
    .map((p): LocalPrompt => {
      const joined = p.collectionIds.flatMap((id) => newIds.get(id) ?? []);
      return {
        ...p,
        id: crypto.randomUUID(),
        collectionIds:
          p.collectionIds.length === 0 && targetId !== undefined
            ? [targetId]
            : joined,
        syncedCollectionIds: [],
        public: false,
      };
    });

  return {
    ...library,
    collections: [...library.collections, ...collections],
    prompts: [...library.prompts, ...prompts],
  };
}
