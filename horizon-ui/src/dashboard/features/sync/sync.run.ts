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
  promptIds: deleteApiPromptPromptId,
  collectionIds: deleteApiCollectionCollectionId,
};

// Brings the server in line with the library. New items arrive private, as
// publishing is a separate step.
export function syncLibrary(access: LibraryAccess) {
  return exclusive(async () => {
    // Collections first, so prompts can join them as they are uploaded.
    for (const { id } of collectionsToCreate(access.get())) {
      await uploadCollection(access, id);
    }
    // Uploads, edits and moves before any deletion: a prompt has to leave a
    // collection before the server deletes that collection, as the deletion
    // takes its prompts along.
    for (const { id } of promptsToPush(access.get())) {
      await uploadPrompt(access, id);
    }
    for (const kind of ["promptIds", "collectionIds"] as const) {
      for (const id of access.get().deleted[kind]) {
        okOrMissing(await deleteOnServer[kind](id));
        access.update((current) => dequeueDeletion(current, kind, id));
      }
    }
  });
}
