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

// Deleting a collection deletes its prompts as well.
export function deleteCollection(library: Library, id: string): Library {
  const collection = library.collections.find((c) => c.id === id);
  if (!collection) return library;

  // The server deletes the prompts that are linked to a deleted collection
  // along with it. The others, not uploaded or linked elsewhere, need their own.
  const needsOwnDeletion = (prompt: Library["prompts"][number]) =>
    collection.serverId === undefined ||
    prompt.syncedCollectionId !== collection.serverId;

  return {
    ...library,
    collections: library.collections.filter((c) => c.id !== id),
    prompts: library.prompts.filter((p) => p.collectionId !== id),
    deleted: {
      collectionIds: queueDeletion(
        library.deleted.collectionIds,
        collection.serverId,
      ),
      promptIds: library.prompts
        .filter((p) => p.collectionId === id && needsOwnDeletion(p))
        .reduce(
          (ids, p) => queueDeletion(ids, p.serverId),
          library.deleted.promptIds,
        ),
    },
  };
}
