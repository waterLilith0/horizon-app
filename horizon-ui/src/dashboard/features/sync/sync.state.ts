import z from "zod";
import type { CollectionState } from "../collections/collection.schema";
import type { Library } from "../library/library.schema";
import type { LocalPrompt, PromptState } from "../prompts/prompt.schema";

// What an item remembers about its copy on the server.
export interface Synced {
  serverId?: number;
  dirty?: boolean;
}

export const syncedShape = {
  serverId: z.number().int().optional(),
  dirty: z.boolean().optional(),
};

// Editing an item that already exists on the server marks it for the next sync.
export const markDirty = <T extends Synced>(item: T): T =>
  item.serverId === undefined ? item : { ...item, dirty: true };

// Deleting something that was never uploaded leaves nothing to delete there.
export const queueDeletion = (ids: number[], serverId: number | undefined) =>
  serverId === undefined ? ids : [...ids, serverId];

// A server copy the library no longer has an item for, such as one deleted
// while its first upload was under way. Queued until the server confirms.
export function queueServerCopy(
  library: Library,
  kind: keyof Library["deleted"],
  serverId: number,
): Library {
  return {
    ...library,
    deleted: {
      ...library.deleted,
      [kind]: queueDeletion(library.deleted[kind], serverId),
    },
  };
}

// The server has confirmed the deletion, so it no longer needs doing.
export function dequeueDeletion(
  library: Library,
  kind: keyof Library["deleted"],
  serverId: number,
): Library {
  return {
    ...library,
    deleted: {
      ...library.deleted,
      [kind]: library.deleted[kind].filter((id) => id !== serverId),
    },
  };
}

// The id the prompt's collection has on the server, if it is uploaded.
export const serverCollectionOf = (
  library: Library,
  prompt: { collectionId?: string },
) => library.collections.find((c) => c.id === prompt.collectionId)?.serverId;

// Server ids belong to one account, so for another one nothing in the library
// is uploaded yet, and visibility goes back to private.
export function detachFromServer(library: Library): Library {
  return {
    ...library,
    collections: library.collections.map((c) => ({
      id: c.id,
      name: c.name,
      creationDate: c.creationDate,
      public: false,
    })),
    prompts: library.prompts.map((p) => ({
      id: p.id,
      promptText: p.promptText,
      type: p.type,
      creationDate: p.creationDate,
      collectionId: p.collectionId,
      public: false,
    })),
    deleted: { collectionIds: [], promptIds: [] },
  };
}

// Visibility only ever comes from the server, so these apply what it confirmed.
// Making a collection private also privatizes its prompts, as the server does.
export function applyCollectionState(
  library: Library,
  id: string,
  state: CollectionState,
): Library {
  return {
    ...library,
    collections: library.collections.map((collection) =>
      collection.id === id ? { ...collection, ...state } : collection,
    ),
    prompts: state.public
      ? library.prompts
      : library.prompts.map((prompt) =>
          prompt.serverId !== undefined &&
          prompt.syncedCollectionId === state.serverId
            ? { ...prompt, public: false }
            : prompt,
        ),
  };
}

// The server answered with the prompt as stored. A local edit made while the
// upload was under way is not in that answer, so the prompt stays pending.
export function applyPromptState(
  library: Library,
  id: string,
  state: PromptState,
  uploaded: Pick<LocalPrompt, "promptText" | "type">,
): Library {
  return {
    ...library,
    prompts: library.prompts.map((prompt) =>
      prompt.id === id
        ? {
            ...prompt,
            ...state,
            dirty:
              prompt.promptText !== uploaded.promptText ||
              prompt.type !== uploaded.type,
          }
        : prompt,
    ),
  };
}
