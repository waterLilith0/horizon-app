import {
  deleteApiCollectionCollectionId,
  deleteApiCollectionCollectionIdPromptsPromptId,
  deleteApiPromptPromptId,
  postApiCollectionCollectionIdPromptsPromptId,
  postApiCollectionCreate,
  postApiPrompt,
  putApiCollectionCollectionIdVisibility,
  putApiPromptPromptId,
} from "@/api/generated/public/horizonAPI";
import { ok, okOrMissing } from "@/api/http";
import type { LocalCollection } from "../collections/collection.schema";
import type { LocalPrompt } from "../prompts/prompt.schema";
import { exclusive, type LibraryAccess } from "./sync.access";
import {
  applyCollectionState,
  applyPromptState,
  serverCollectionOf,
} from "./sync.state";

// Local state only changes from what the server confirms, so every upload
// applies its result as soon as it arrives. A failure keeps earlier ones.

async function pushCollection(collection: LocalCollection, isPublic: boolean) {
  if (collection.serverId === undefined) {
    const created = ok(
      await postApiCollectionCreate({
        collectionName: collection.name,
        public: isPublic,
      }),
    );
    return { serverId: Number(created.collectionId), public: created.public };
  }
  const updated = ok(
    await putApiCollectionCollectionIdVisibility(collection.serverId, {
      public: isPublic,
      includePrompts: !isPublic,
    }),
  );
  return { serverId: collection.serverId, public: updated.public };
}

async function relink(
  promptId: number,
  from: number | undefined,
  to: number | undefined,
) {
  if (from === to) return;
  if (from !== undefined) {
    okOrMissing(
      await deleteApiCollectionCollectionIdPromptsPromptId(from, promptId),
    );
  }
  if (to !== undefined) {
    const res = await postApiCollectionCollectionIdPromptsPromptId(
      to,
      promptId,
    );
    if (res.status !== 409) ok(res);
  }
}

async function pushPrompt(
  prompt: LocalPrompt,
  collectionServerId: number | undefined,
  isPublic: boolean,
) {
  if (prompt.serverId === undefined) {
    const { prompt: created } = ok(
      await postApiPrompt({
        promptText: prompt.promptText,
        type: prompt.type,
        collectionId: collectionServerId,
        public: isPublic,
      }),
    );
    return {
      serverId: Number(created.promptId),
      public: created.public,
      syncedCollectionId: collectionServerId,
    };
  }
  // The update also carries any pending local edit to the text or type.
  const updated = ok(
    await putApiPromptPromptId(prompt.serverId, {
      promptText: prompt.promptText,
      type: prompt.type,
      public: isPublic,
    }),
  );
  await relink(prompt.serverId, prompt.syncedCollectionId, collectionServerId);
  return {
    serverId: prompt.serverId,
    public: updated.public,
    syncedCollectionId: collectionServerId,
  };
}

// An item deleted while its first upload was under way had no server id to
// queue a deletion for, so the uploads below remove its fresh server copy.

// Uploads a collection as it is now, with the given visibility or its own.
export async function uploadCollection(
  access: LibraryAccess,
  id: string,
  isPublic?: boolean,
) {
  const collection = access.get().collections.find((c) => c.id === id);
  if (!collection) return;

  const state = await pushCollection(collection, isPublic ?? collection.public);
  access.update((current) => applyCollectionState(current, id, state));
  if (
    collection.serverId === undefined &&
    !access.get().collections.some((c) => c.id === id)
  ) {
    okOrMissing(await deleteApiCollectionCollectionId(state.serverId));
  }
}

// Uploads a prompt as it is now: its text, its collection, its visibility.
export async function uploadPrompt(
  access: LibraryAccess,
  id: string,
  isPublic?: boolean,
) {
  const library = access.get();
  const prompt = library.prompts.find((p) => p.id === id);
  if (!prompt) return;

  const state = await pushPrompt(
    prompt,
    serverCollectionOf(library, prompt),
    isPublic ?? prompt.public,
  );
  access.update((current) => applyPromptState(current, id, state, prompt));
  if (
    prompt.serverId === undefined &&
    !access.get().prompts.some((p) => p.id === id)
  ) {
    okOrMissing(await deleteApiPromptPromptId(state.serverId));
  }
}

export const setPromptPublished = (
  promptId: string,
  isPublic: boolean,
  access: LibraryAccess,
) => exclusive(() => uploadPrompt(access, promptId, isPublic));

// Publishing sends the chosen prompts along. Making private needs none, since
// the server privatizes the collection's prompts with it.
export const setCollectionPublished = (
  collectionId: string,
  isPublic: boolean,
  chosenIds: string[],
  access: LibraryAccess,
) =>
  exclusive(async () => {
    await uploadCollection(access, collectionId, isPublic);
    if (!isPublic) return;
    // After the collection exists on the server, so the prompts can join it.
    for (const id of chosenIds) await uploadPrompt(access, id, true);
  });
