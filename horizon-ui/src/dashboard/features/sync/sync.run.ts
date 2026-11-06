import {
  deleteApiCollectionCollectionId,
  deleteApiPromptPromptId,
} from "@/api/generated/public/horizonAPI";
import { okOrMissing } from "@/api/http";
import type { Library } from "../library/library.schema";
import { exclusive, type LibraryAccess } from "./sync.access";
import { dequeueDeletion, membershipDiffers } from "./sync.state";
import { pullLibrary } from "./sync.pull";
import { uploadCollection, uploadPrompt } from "./sync.upload";

const collectionsToCreate = (library: Library) =>
  library.collections.filter((c) => c.serverId === undefined);

// Prompts that differ from the server: not uploaded yet, edited, or in other
// collections than the server has them in. One the server lost has nothing to
// update, until the user decides what happens to it.
const promptsToPush = (library: Library) =>
  library.prompts.filter(
    (p) =>
      !p.missing &&
      (p.serverId === undefined ||
        p.dirty === true ||
        membershipDiffers(library, p)),
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
  collectionIds: (id: number) => deleteApiCollectionCollectionId(id),
};

// Brings the server in line with the library. New items arrive private, as
// publishing is a separate step.
export function syncLibrary(access: LibraryAccess) {
  return exclusive(async () => {
    // Collections first, so prompts can join them as they are uploaded.
    for (const { id } of collectionsToCreate(access.get())) {
      await uploadCollection(access, id);
    }
    for (const { id } of promptsToPush(access.get())) {
      await uploadPrompt(access, id);
    }
    // Deleting a collection never deletes its prompts on the server, so each
    // prompt that is meant to go is deleted on its own.
    for (const kind of ["promptIds", "collectionIds"] as const) {
      for (const id of access.get().deleted[kind]) {
        okOrMissing(await deleteOnServer[kind](id));
        access.update((current) => dequeueDeletion(current, kind, id));
      }
    }
    await pullLibrary(access);
  });
}
