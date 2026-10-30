import type { CollectionValues } from "../features/collections/collection.schema";
import type { PromptValues } from "../features/prompts/prompt.schema";

export const initialPrompts: PromptValues[] = [
  {
    promptId: 0,
    promptText: "Test",
    type: "action",
    creationDate: new Date("01-10-2026"),
    public: false,
  },
  {
    promptId: 1,
    promptText: "Test",
    type: "question",
    creationDate: new Date(),
    public: false,
  },
];

export const initialCollections: CollectionValues[] = [
  { collectionId: 0, name: "Test", creationDate: new Date() },
  { collectionId: 1, name: "Second", creationDate: new Date() },
];
