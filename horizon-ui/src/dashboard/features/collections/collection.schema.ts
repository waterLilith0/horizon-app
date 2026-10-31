import type { Collection as ApiCollection } from "@/api/generated/public/horizonAPI";
import z from "zod";
import { FIELD_MAX } from "@/api/limits";
import { syncedShape, type Synced } from "../sync/sync.state";

export type LocalCollection = Pick<ApiCollection, "name" | "public"> &
  Synced & { id: string; creationDate: ApiCollection["creationDate"] };

// What the server confirms about a collection after an upload.
export type CollectionState = Pick<LocalCollection, "serverId" | "public">;

export const CollectionNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(FIELD_MAX, `Name must be ${FIELD_MAX} characters or fewer`);

export const LocalCollectionSchema = z.object({
  id: z.string(),
  name: CollectionNameSchema,
  public: z.boolean(),
  creationDate: z.string(),
  ...syncedShape,
}) satisfies z.ZodType<LocalCollection>;
