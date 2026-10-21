import type { PromptValues } from "../features/prompts/Prompt";

export const initialPrompts: PromptValues[] = [
  {
    promptId: 0,
    promptText: "Test",
    type: "action",
    creationDate: new Date("01-10-2026"),
  },
  {
    promptId: 1,
    promptText: "Test",
    type: "question",
    creationDate: new Date(),
  },
];
