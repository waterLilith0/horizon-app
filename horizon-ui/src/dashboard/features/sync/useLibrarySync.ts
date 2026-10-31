import { useEffect, useState } from "react";
import { useAtomValue, useStore } from "jotai";
import { useServerAction } from "@/shared/useServerAction";
import type { Library } from "../library/library.schema";
import { libraryAtom } from "../library/library.store";
import { useLibraryAccess } from "./sync.access";
import { countPendingChanges, syncLibrary } from "./sync.run";

const DEBOUNCE_MS = 1000;

// Syncs on demand, and by itself once the library has been quiet for a moment
// when auto is on. After a failure it waits for a new change, or the user,
// instead of retrying in a loop.
export function useLibrarySync(auto: boolean) {
  const access = useLibraryAccess();
  const store = useStore();
  const library = useAtomValue(libraryAtom);
  const [failedAt, setFailedAt] = useState<Library>();
  const {
    pending: running,
    error,
    run,
  } = useServerAction(() => syncLibrary(access));
  const changes = countPendingChanges(library);

  async function sync() {
    if (!(await run())) setFailedAt(store.get(libraryAtom));
  }

  useEffect(() => {
    if (!auto || running || changes === 0 || library === failedAt) return;
    const timer = setTimeout(() => void sync(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  return { changes, running, error, sync };
}
