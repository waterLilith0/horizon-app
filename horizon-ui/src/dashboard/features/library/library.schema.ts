import z from "zod";
import {
  LocalCollectionSchema,
  type LocalCollection,
} from "../collections/collection.schema";
import { LocalPromptSchema, type LocalPrompt } from "../prompts/prompt.schema";

export interface Library {
  version: 1;
  collections: LocalCollection[];
  prompts: LocalPrompt[];
  deleted: { collectionIds: number[]; promptIds: number[] };
}

export const EMPTY_LIBRARY: Library = {
  version: 1,
  collections: [],
  prompts: [],
  deleted: { collectionIds: [], promptIds: [] },
};

export const LibrarySchema = z.object({
  version: z.literal(1),
  collections: z.array(LocalCollectionSchema),
  prompts: z.array(LocalPromptSchema),
  deleted: z.object({
    collectionIds: z.array(z.number().int()),
    promptIds: z.array(z.number().int()),
  }),
}) satisfies z.ZodType<Library>;

// What leaves the app and comes back in: no server ids, visibility or sync
// state, so an import always starts private and unsynced. A prompt belongs to
// the collections in the same file that it lists. One that lists none joins
// whichever collection it is imported into.
export const LibraryFileSchema = z
  .object({
    version: z.literal(1),
    collections: z.array(
      LocalCollectionSchema.omit({
        public: true,
        serverId: true,
        dirty: true,
        missing: true,
      }),
    ),
    prompts: z.array(
      LocalPromptSchema.omit({
        public: true,
        serverId: true,
        dirty: true,
        missing: true,
        syncedCollectionIds: true,
      }),
    ),
  })
  .refine(
    (file) => {
      const ids = new Set(file.collections.map((c) => c.id));
      return file.prompts.every((p) =>
        p.collectionIds.every((id) => ids.has(id)),
      );
    },
    { message: "A prompt belongs to a collection that is not in the file." },
  );

export type LibraryFile = z.infer<typeof LibraryFileSchema>;

// Libraries and files from when a prompt could be in one collection only.
export function upgradePrompts(json: unknown): unknown {
  if (typeof json !== "object" || json === null) return json;
  const { prompts, ...rest } = json as Record<string, unknown>;
  return {
    ...rest,
    prompts: Array.isArray(prompts) ? prompts.map(upgradePrompt) : prompts,
  };
}

function upgradePrompt(prompt: unknown) {
  if (typeof prompt !== "object" || prompt === null) return prompt;
  const { collectionId, syncedCollectionId, ...rest } = prompt as Record<
    string,
    unknown
  >;
  return {
    collectionIds: collectionId === undefined ? [] : [collectionId],
    syncedCollectionIds:
      syncedCollectionId === undefined ? [] : [syncedCollectionId],
    ...rest,
  };
}
