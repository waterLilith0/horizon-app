import z from "zod";
import type { Prompt as ApiPrompt } from "@/api/generated/public/horizonAPI";
import { FIELD_MAX } from "@/api/limits";
import { syncedShape, type Synced } from "../sync/sync.state";

export const PROMPT_TYPES = ["question", "action", "group-action"] as const;

export type LocalPrompt = Pick<ApiPrompt, "promptText" | "type" | "public"> &
  Synced & {
    id: string;
    creationDate: ApiPrompt["creationDate"];
    // A prompt can be in any number of collections, and in none.
    collectionIds: string[];
    // The server ids of the collections it was in as of the last sync.
    syncedCollectionIds: number[];
  };

// What the server confirms about a prompt after an upload. Its collections
// are only part of it when the upload decided them.
export type PromptState = Pick<LocalPrompt, "serverId" | "public"> &
  Partial<Pick<LocalPrompt, "syncedCollectionIds">>;

export const PromptTextSchema = z
  .string()
  .trim()
  .min(1, "Prompt is required")
  .max(FIELD_MAX, `Prompt must be ${FIELD_MAX} characters or fewer`);

export const LocalPromptSchema = z.object({
  id: z.string(),
  promptText: PromptTextSchema,
  type: z.string().trim().min(1).max(FIELD_MAX),
  public: z.boolean(),
  creationDate: z.string(),
  collectionIds: z.array(z.string()),
  syncedCollectionIds: z.array(z.number().int()),
  ...syncedShape,
}) satisfies z.ZodType<LocalPrompt>;
