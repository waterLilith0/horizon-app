import {
  deleteApiCollectionCollectionId,
  deleteApiPromptPromptId,
} from "@/api/generated/public/horizonAPI";
import { okOrMissing } from "@/api/http";
import type { Library } from "../library/library.schema";
import { exclusive, type LibraryAccess } from "./sync.access";
import { dequeueDeletion, serverCollectionOf } from "./sync.state";
import { uploadCollection, uploadPrompt } from "./sync.upload";

const collectionsToCreate = (library: Library) =>
  library.collections.filter((c) => c.serverId === undefined);

// Prompts that differ from the server: not uploaded yet, edited, or in a
// different collection than the server has them in.
const promptsToPush = (library: Library) =>
  library.prompts.filter(
    (p) =>
      p.serverId === undefined ||
      p.dirty === true ||
      serverCollectionOf(library, p) !== p.syncedCollectionId,
  );

export function countPendingChanges(library: Library): number {
  return (
    collectionsToCreate(library).length +
    promptsToPush(library).length +
    library.deleted.promptIds.length +
    library.deleted.collectionIds.length
  );
}

const deleteOnServer = {
  promptIds: (id: number) => deleteApiPromptPromptId(id),
  collectionIds: (id: number) =>
    deleteApiCollectionCollectionId(id, { deletePrompts: true }),
};

// Uploads what differs from the server until nothing is left, since the library
// can change while uploads are under way. Collections go first, so prompts can
// join them as they are uploaded.
async function pushPending(access: LibraryAccess) {
  for (let library = access.get(); ; library = access.get()) {
    const collections = collectionsToCreate(library);
    const prompts = promptsToPush(library);
    if (collections.length + prompts.length === 0) return;
    for (const { id } of collections) await uploadCollection(access, id);
    for (const { id } of prompts) await uploadPrompt(access, id);
  }
}

// Brings the server in line with the library. New items arrive private, as
// publishing is a separate step.
export function syncLibrary(access: LibraryAccess) {
  return exclusive(async () => {
    await pushPending(access);
    for (const kind of ["promptIds", "collectionIds"] as const) {
      for (const id of access.get().deleted[kind]) {
        // A prompt moved out of a collection has to leave it first, or
        // deleting the collection would delete the prompt too.
        if (kind === "collectionIds") await pushPending(access);
        okOrMissing(await deleteOnServer[kind](id));
        access.update((current) => dequeueDeletion(current, kind, id));
      }
    }
  });
}
