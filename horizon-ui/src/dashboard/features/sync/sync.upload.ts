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
import type { Library } from "../library/library.schema";
import type { LocalPrompt } from "../prompts/prompt.schema";
import { exclusive, type LibraryAccess } from "./sync.access";
import {
  applyCollectionState,
  applyPromptState,
  applySyncedMembership,
  dequeueDeletion,
  queueServerCopy,
  serverCollectionsOf,
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

// A new prompt can be created in one collection right away, the others are
// joined afterwards.
async function pushPrompt(
  prompt: LocalPrompt,
  firstCollection: number | undefined,
  isPublic: boolean,
) {
  if (prompt.serverId === undefined) {
    const { prompt: created } = ok(
      await postApiPrompt({
        promptText: prompt.promptText,
        type: prompt.type,
        collectionId: firstCollection,
        public: isPublic,
      }),
    );
    return {
      serverId: Number(created.promptId),
      public: created.public,
      syncedCollectionIds:
        firstCollection === undefined ? [] : [firstCollection],
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
  return { serverId: prompt.serverId, public: updated.public };
}

// Leaves and joins collections until the server has the prompt where the
// library does. Each confirmed change is kept, so a failure part-way is
// continued by the next sync.
async function syncMembership(access: LibraryAccess, id: string) {
  const library = access.get();
  const prompt = library.prompts.find((p) => p.id === id);
  if (prompt?.serverId === undefined) return;

  const wanted = serverCollectionsOf(library, prompt);
  for (const collectionId of prompt.syncedCollectionIds) {
    if (wanted.includes(collectionId)) continue;
    okOrMissing(
      await deleteApiCollectionCollectionIdPromptsPromptId(
        collectionId,
        prompt.serverId,
      ),
    );
    access.update((current) =>
      applySyncedMembership(current, id, collectionId, false),
    );
  }
  for (const collectionId of wanted) {
    if (prompt.syncedCollectionIds.includes(collectionId)) continue;
    const res = await postApiCollectionCollectionIdPromptsPromptId(
      collectionId,
      prompt.serverId,
    );
    if (res.status !== 409) ok(res);
    access.update((current) =>
      applySyncedMembership(current, id, collectionId, true),
    );
  }
}

// An item deleted while its first upload was under way had no server id to
// queue a deletion for. Its fresh server copy is queued, so a failed removal is
// retried by the next sync, and then removed right away.
async function discardServerCopy(
  access: LibraryAccess,
  kind: keyof Library["deleted"],
  serverId: number,
  remove: (serverId: number) => Promise<{ status: number }>,
) {
  access.update((current) => queueServerCopy(current, kind, serverId));
  okOrMissing(await remove(serverId));
  access.update((current) => dequeueDeletion(current, kind, serverId));
}

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
    await discardServerCopy(
      access,
      "collectionIds",
      state.serverId,
      (serverId) => deleteApiCollectionCollectionId(serverId),
    );
  }
}

// Uploads a prompt as it is now: its text, its collections, its visibility.
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
    serverCollectionsOf(library, prompt).at(0),
    isPublic ?? prompt.public,
  );
  access.update((current) => applyPromptState(current, id, state, prompt));
  if (
    prompt.serverId === undefined &&
    !access.get().prompts.some((p) => p.id === id)
  ) {
    await discardServerCopy(access, "promptIds", state.serverId, (serverId) =>
      deleteApiPromptPromptId(serverId),
    );
    return;
  }
  await syncMembership(access, id);
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
