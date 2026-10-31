import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import type { Collection, Prompt } from "@/api/generated/public/horizonAPI";
import { addPrompt } from "../prompts/prompt.ops";
import { mergeLibrary } from "../library/library.merge";
import type { LibraryFile } from "../library/library.schema";
import { libraryAtom } from "../library/library.store";
import { collectionPromptsQuery } from "./search.queries";

// A found collection in the shape of an import file, so it is added like one.
function publicCollectionToFile(collection: Collection, prompts: Prompt[]) {
  const id = String(collection.collectionId);
  return {
    version: 1,
    collections: [
      { id, name: collection.name, creationDate: collection.creationDate },
    ],
    prompts: prompts.map((p) => ({
      id: String(p.promptId),
      promptText: p.promptText,
      type: p.type,
      creationDate: p.creationDate,
      collectionIds: [id],
    })),
  } satisfies LibraryFile;
}

// Copies land in the user's own library, private and unsynced.
export function useSaveToLibrary() {
  const queryClient = useQueryClient();
  const setLibrary = useSetAtom(libraryAtom);

  return {
    savePrompt: (prompt: Prompt) =>
      setLibrary((current) =>
        addPrompt(current, {
          promptText: prompt.promptText,
          type: prompt.type,
          collectionIds: [],
        }),
      ),
    saveCollection: async (collection: Collection) => {
      const prompts = await queryClient.query(
        collectionPromptsQuery(Number(collection.collectionId)),
      );
      setLibrary((current) =>
        mergeLibrary(
          current,
          publicCollectionToFile(collection, prompts),
          undefined,
          false,
        ),
      );
    },
  };
}
