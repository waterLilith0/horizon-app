import { Prompt, type Collection } from "@/api/generated/public/schemas";
import { atomWithStorage } from "jotai/utils";

export const promptsAtom = atomWithStorage<Prompt[]>("prompts", []);
export const collectionAtom = atomWithStorage<Collection[]>("collections", []);
