import z from "zod";
import type {
  Collection as ApiCollection,
  Prompt as ApiPrompt,
} from "@/api/generated/public/horizonAPI";
import type {
  CollectionState,
  LocalCollection,
} from "../collections/collection.schema";
import type { Library } from "../library/library.schema";
import type { LocalPrompt, PromptState } from "../prompts/prompt.schema";

// What an item remembers about its copy on the server. Missing means the
// server no longer has the copy this item was uploaded as.
export interface Synced {
  serverId?: number;
  dirty?: boolean;
  missing?: boolean;
}

export const syncedShape = {
  serverId: z.number().int().optional(),
  dirty: z.boolean().optional(),
  missing: z.boolean().optional(),
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

// The collections the prompt is in that exist on the server, as their ids there.
// One the server lost can't be joined, so it doesn't count.
export const serverCollectionsOf = (
  library: Library,
  prompt: Pick<LocalPrompt, "collectionIds">,
) =>
  library.collections.flatMap((c) =>
    c.serverId !== undefined &&
    !c.missing &&
    prompt.collectionIds.includes(c.id)
      ? [c.serverId]
      : [],
  );

// Whether the prompt's collections here differ from what the server has.
export const membershipDiffers = (library: Library, prompt: LocalPrompt) => {
  const wanted = serverCollectionsOf(library, prompt);
  return (
    wanted.length !== prompt.syncedCollectionIds.length ||
    wanted.some((id) => !prompt.syncedCollectionIds.includes(id))
  );
};

// The server confirmed that the prompt joined or left one of its collections.
export function applySyncedMembership(
  library: Library,
  id: string,
  collectionServerId: number,
  member: boolean,
): Library {
  return {
    ...library,
    prompts: library.prompts.map((prompt) =>
      prompt.id === id
        ? {
            ...prompt,
            syncedCollectionIds: member
              ? [...prompt.syncedCollectionIds, collectionServerId]
              : prompt.syncedCollectionIds.filter(
                  (c) => c !== collectionServerId,
                ),
          }
        : prompt,
    ),
  };
}

// Items as they are before any upload: private, with no link to the server.
const unsyncedCollection = (c: LocalCollection): LocalCollection => ({
  id: c.id,
  name: c.name,
  creationDate: c.creationDate,
  public: false,
});

const unsyncedPrompt = (p: LocalPrompt): LocalPrompt => ({
  id: p.id,
  promptText: p.promptText,
  type: p.type,
  creationDate: p.creationDate,
  collectionIds: p.collectionIds,
  syncedCollectionIds: [],
  public: false,
});

// Server ids belong to one account, so for another one nothing in the library
// is uploaded yet, and visibility goes back to private.
export function detachFromServer(library: Library): Library {
  return {
    ...library,
    collections: library.collections.map(unsyncedCollection),
    prompts: library.prompts.map(unsyncedPrompt),
    deleted: { collectionIds: [], promptIds: [] },
  };
}

export const countMissing = (library: Library) =>
  library.collections.filter((c) => c.missing).length +
  library.prompts.filter((p) => p.missing).length;

// Items the server lost become new ones, which the next sync uploads again.
export function reuploadMissing(library: Library): Library {
  return {
    ...library,
    collections: library.collections.map((c) =>
      c.missing ? unsyncedCollection(c) : c,
    ),
    prompts: library.prompts.map((p) => (p.missing ? unsyncedPrompt(p) : p)),
  };
}

// Prompts of a removed collection stay, as the server still has them.
export function removeMissing(library: Library): Library {
  const removed = new Set(
    library.collections.filter((c) => c.missing).map((c) => c.id),
  );
  return {
    ...library,
    collections: library.collections.filter((c) => !c.missing),
    prompts: library.prompts
      .filter((p) => !p.missing)
      .map((p) => ({
        ...p,
        collectionIds: p.collectionIds.filter((id) => !removed.has(id)),
      })),
  };
}

// Brings in what the account has on the server that the library doesn't know
// yet, ahead of what is already there. What the library already has is left as
// it is, but marked when the server no longer has it, and it joins the
// collections the server newly has it in. Items waiting for their deletion are
// not brought back.
export function applyPull(
  library: Library,
  server: { collections: ApiCollection[]; prompts: ApiPrompt[] },
): Library {
  const collectionsOnServer = new Set(
    server.collections.map((c) => Number(c.collectionId)),
  );
  const serverPrompts = new Map(
    server.prompts.map((p) => [Number(p.promptId), p]),
  );
  const knownIds = (items: Synced[]) =>
    new Set(items.map((item) => item.serverId));
  const knownCollections = knownIds(library.collections);
  const knownPrompts = knownIds(library.prompts);
  const flag = <T extends Synced>(item: T, onServer: boolean): T => ({
    ...item,
    missing: (item.serverId !== undefined && !onServer) || undefined,
  });

  const collections = [
    ...library.collections.map((c) =>
      flag(c, c.serverId === undefined || collectionsOnServer.has(c.serverId)),
    ),
    ...server.collections
      .filter(
        (c) =>
          !knownCollections.has(Number(c.collectionId)) &&
          !library.deleted.collectionIds.includes(Number(c.collectionId)),
      )
      .map((c): LocalCollection => ({
        id: crypto.randomUUID(),
        name: c.name,
        public: c.public,
        creationDate: c.creationDate,
        serverId: Number(c.collectionId),
      })),
  ];

  const serverIdsOf = (prompt: ApiPrompt) =>
    (prompt.collectionIds ?? []).map(Number);
  const localIdsOf = (serverIds: number[]) =>
    collections.flatMap((c) =>
      c.serverId !== undefined && serverIds.includes(c.serverId) ? [c.id] : [],
    );

  const known = library.prompts.map((p) => {
    const onServer =
      p.serverId === undefined ? undefined : serverPrompts.get(p.serverId);
    const flagged = flag(p, p.serverId === undefined || onServer !== undefined);
    if (!onServer) return flagged;
    // Local memberships stay, behind what the server newly has it in.
    const serverIds = serverIdsOf(onServer);
    const joined = localIdsOf(
      serverIds.filter((id) => !p.syncedCollectionIds.includes(id)),
    ).filter((id) => !p.collectionIds.includes(id));
    return {
      ...flagged,
      collectionIds: [...p.collectionIds, ...joined],
      syncedCollectionIds: serverIds,
    };
  });

  const added = server.prompts
    .filter(
      (p) =>
        !knownPrompts.has(Number(p.promptId)) &&
        !library.deleted.promptIds.includes(Number(p.promptId)),
    )
    .map((p): LocalPrompt => {
      const serverIds = serverIdsOf(p);
      return {
        id: crypto.randomUUID(),
        promptText: p.promptText,
        type: p.type,
        public: p.public,
        creationDate: p.creationDate,
        serverId: Number(p.promptId),
        collectionIds: localIdsOf(serverIds),
        syncedCollectionIds: serverIds,
      };
    });

  return { ...library, collections, prompts: [...added, ...known] };
}

// Visibility only ever comes from the server, so these apply what it confirmed.
// Making a collection private also privatizes its prompts, as the server does.
export function applyCollectionState(
  library: Library,
  id: string,
  state: CollectionState,
): Library {
  const { serverId } = state;
  return {
    ...library,
    collections: library.collections.map((collection) =>
      collection.id === id ? { ...collection, ...state } : collection,
    ),
    prompts:
      state.public || serverId === undefined
        ? library.prompts
        : library.prompts.map((prompt) =>
            prompt.serverId !== undefined &&
            prompt.syncedCollectionIds.includes(serverId)
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
