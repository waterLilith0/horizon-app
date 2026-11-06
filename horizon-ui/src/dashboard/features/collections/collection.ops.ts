import type { Library } from "../library/library.schema";
import { queueDeletion } from "../sync/sync.state";
import type { LocalCollection } from "./collection.schema";

export function createCollection(name: string): LocalCollection {
  return {
    id: crypto.randomUUID(),
    name,
    public: false,
    creationDate: new Date().toISOString(),
  };
}

export function addCollection(
  library: Library,
  collection: LocalCollection,
): Library {
  return { ...library, collections: [...library.collections, collection] };
}

// Deleting a collection deletes the prompts that are in no other collection.
// The others stay, in the collections they are still in.
export function deleteCollection(library: Library, id: string): Library {
  const collection = library.collections.find((c) => c.id === id);
  if (!collection) return library;

  const isOnlyIn = (prompt: Library["prompts"][number]) =>
    prompt.collectionIds.length === 1 && prompt.collectionIds[0] === id;

  return {
    ...library,
    collections: library.collections.filter((c) => c.id !== id),
    prompts: library.prompts
      .filter((p) => !isOnlyIn(p))
      .map((p) =>
        p.collectionIds.includes(id)
          ? { ...p, collectionIds: p.collectionIds.filter((c) => c !== id) }
          : p,
      ),
    deleted: {
      collectionIds: queueDeletion(
        library.deleted.collectionIds,
        collection.serverId,
      ),
      promptIds: library.prompts
        .filter(isOnlyIn)
        .reduce(
          (ids, p) => queueDeletion(ids, p.serverId),
          library.deleted.promptIds,
        ),
    },
  };
}
