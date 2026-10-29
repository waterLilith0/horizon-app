import z from "zod";

export const PROMPT_TYPES = ["question", "action", "group-action"] as const;

const PromptSchema = z.object({
  promptId: z.int(),
  promptText: z.string(),
  type: z.enum(PROMPT_TYPES),
  creationDate: z.date(),
  public: z.boolean(),
});

export type PromptValues = z.infer<typeof PromptSchema>;

export type PromptColumnHandlers = {
  updateText: (id: number, text: string) => void;
  updateType: (id: number, type: PromptValues["type"]) => void;
  deletePrompt: (id: number) => void;
};

export const PromptTextSchema = PromptSchema.shape.promptText;
