import { useSetAtom, useStore } from "jotai";
import { libraryAtom } from "../library/library.store";
import type { Library } from "../library/library.schema";

type Update = (change: (library: Library) => Library) => void;

// How the server actions reach the library. They read it when they run, not
// when they were requested, since other actions may have changed it by then.
export interface LibraryAccess {
  get: () => Library;
  update: Update;
}

export function useLibraryAccess(): LibraryAccess {
  const store = useStore();
  const update = useSetAtom(libraryAtom);
  return { get: () => store.get(libraryAtom), update };
}

let queue: Promise<unknown> = Promise.resolve();

// Server actions run one at a time. Two at once could upload the same new item
// twice, as each would still see it as not uploaded.
export function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);
  queue = result.catch(() => undefined);
  return result;
}
