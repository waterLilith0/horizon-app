import type { Library } from "../library/library.schema";
import { markDirty, queueDeletion } from "../sync/sync.state";
import type { LocalPrompt } from "./prompt.schema";

export function addPrompt(
  library: Library,
  prompt: Pick<LocalPrompt, "promptText" | "type" | "collectionId">,
): Library {
  const created: LocalPrompt = {
    ...prompt,
    id: crypto.randomUUID(),
    public: false,
    creationDate: new Date().toISOString(),
  };
  return { ...library, prompts: [...library.prompts, created] };
}

export function updatePrompt(
  library: Library,
  id: string,
  changes: Partial<Pick<LocalPrompt, "promptText" | "type">>,
): Library {
  return {
    ...library,
    prompts: library.prompts.map((prompt) =>
      prompt.id === id ? markDirty({ ...prompt, ...changes }) : prompt,
    ),
  };
}

// Membership is compared against the server separately, so a move is not an
// edit. Without a collection the prompt stands on its own.
export function movePrompt(
  library: Library,
  id: string,
  collectionId: string | undefined,
): Library {
  return {
    ...library,
    prompts: library.prompts.map((prompt) =>
      prompt.id === id ? { ...prompt, collectionId } : prompt,
    ),
  };
}

export function deletePrompt(library: Library, id: string): Library {
  const prompt = library.prompts.find((p) => p.id === id);
  if (!prompt) return library;

  return {
    ...library,
    prompts: library.prompts.filter((p) => p.id !== id),
    deleted: {
      ...library.deleted,
      promptIds: queueDeletion(library.deleted.promptIds, prompt.serverId),
    },
  };
}
