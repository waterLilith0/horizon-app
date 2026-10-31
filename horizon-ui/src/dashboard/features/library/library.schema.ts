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
// state, so an import always starts private and unsynced. A prompt either
// belongs to a collection in the same file, or has none and joins whichever
// collection it is imported into.
export const LibraryFileSchema = z
  .object({
    version: z.literal(1),
    collections: z.array(
      LocalCollectionSchema.omit({ public: true, serverId: true, dirty: true }),
    ),
    prompts: z.array(
      LocalPromptSchema.omit({
        public: true,
        serverId: true,
        dirty: true,
        syncedCollectionId: true,
      }),
    ),
  })
  .refine(
    (file) => {
      const ids = new Set(file.collections.map((c) => c.id));
      return file.prompts.every(
        (p) => p.collectionId === undefined || ids.has(p.collectionId),
      );
    },
    { message: "A prompt belongs to a collection that is not in the file." },
  );

export type LibraryFile = z.infer<typeof LibraryFileSchema>;
