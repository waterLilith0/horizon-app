import z from "zod";
import type { Prompt as ApiPrompt } from "@/api/generated/public/horizonAPI";
import { FIELD_MAX } from "@/api/limits";
import { syncedShape, type Synced } from "../sync/sync.state";

export const PROMPT_TYPES = ["question", "action", "group-action"] as const;

export type LocalPrompt = Pick<ApiPrompt, "promptText" | "type" | "public"> &
  Synced & {
    id: string;
    creationDate: ApiPrompt["creationDate"];
    collectionId?: string;
    syncedCollectionId?: number;
  };

// What the server confirms about a prompt after an upload.
export type PromptState = Pick<
  LocalPrompt,
  "serverId" | "public" | "syncedCollectionId"
>;

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
  collectionId: z.string().optional(),
  syncedCollectionId: z.number().int().optional(),
  ...syncedShape,
}) satisfies z.ZodType<LocalPrompt>;
