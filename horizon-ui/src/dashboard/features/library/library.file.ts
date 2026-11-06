import type { LocalCollection } from "../collections/collection.schema";
import type { LocalPrompt } from "../prompts/prompt.schema";
import {
  LibraryFileSchema,
  upgradePrompts,
  type Library,
  type LibraryFile,
} from "./library.schema";

// The schema drops server ids and sync state.
const toFile = (collections: LocalCollection[], prompts: LocalPrompt[]) =>
  LibraryFileSchema.parse({ version: 1, collections, prompts });

// A collection together with its prompts.
export function collectionToFile(
  library: Library,
  collection: LocalCollection,
): LibraryFile {
  return toFile(
    [collection],
    library.prompts
      .filter((p) => p.collectionIds.includes(collection.id))
      .map((p) => ({ ...p, collectionIds: [collection.id] })),
  );
}

// Prompts on their own, to join whichever collection they are imported into.
export function promptsToFile(prompts: LocalPrompt[]): LibraryFile {
  return toFile(
    [],
    prompts.map((p) => ({ ...p, collectionIds: [] })),
  );
}

export function parseLibraryFile(text: string): LibraryFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  const result = LibraryFileSchema.safeParse(upgradePrompts(json));
  if (!result.success) {
    const [issue] = result.error.issues;
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    const detail = issue ? ` (${where}${issue.message})` : "";
    throw new Error(`This is not a Horizon library file${detail}.`);
  }
  return result.data;
}

export function downloadLibraryFile(file: LibraryFile, name: string) {
  const slug = name.replace(/[^\p{L}\p{N}]+/gu, "-");
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `horizon-${slug}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
