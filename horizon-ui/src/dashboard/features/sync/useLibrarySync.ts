import { useEffect, useState } from "react";
import { useAtomValue, useStore } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { LIBRARY_POLL_MS, POLL_AFTER_FAILURE_MS } from "@/api/polling";
import { useServerAction } from "@/shared/useServerAction";
import type { Library } from "../library/library.schema";
import { libraryAtom } from "../library/library.store";
import { useLibraryAccess } from "./sync.access";
import { pullServerItems } from "./sync.pull";
import { countPendingChanges, syncLibrary } from "./sync.run";

const DEBOUNCE_MS = 1000;

// Syncs on demand, and by itself once the library has been quiet for a moment
// when auto is on. After a failure, or a sync that left changes behind, it
// waits for a new change, or the user, instead of retrying in a loop.
//
// Once the user has agreed to sync, the account's library version is also
// checked now and then, and what the account has on the server is loaded when
// it changed. That is no upload, so it needs no auto. The query only schedules
// it: it pauses while the tab is hidden, and catches up on return.
export function useLibrarySync(auto: boolean, linkedUserId?: number) {
  const access = useLibraryAccess();
  const store = useStore();
  const library = useAtomValue(libraryAtom);
  const [failedAt, setFailedAt] = useState<Library>();
  const {
    pending: running,
    error: syncError,
    run,
  } = useServerAction(() => syncLibrary(access));
  const poll = useQuery({
    queryKey: ["pull", linkedUserId],
    queryFn: async () => {
      await pullServerItems(access);
      return null;
    },
    enabled: linkedUserId !== undefined,
    staleTime: LIBRARY_POLL_MS,
    refetchInterval: (query) =>
      query.state.status === "error" ? POLL_AFTER_FAILURE_MS : LIBRARY_POLL_MS,
    retry: false,
  });
  const changes = countPendingChanges(library);

  async function sync() {
    const succeeded = await run();
    const after = store.get(libraryAtom);
    // After a failure, or a sync that left changes behind, trying again right
    // away would only repeat it, so it waits for a new change.
    if (!succeeded || countPendingChanges(after) > 0) setFailedAt(after);
  }

  useEffect(() => {
    if (!auto || running || changes === 0 || library === failedAt) return;
    const timer = setTimeout(() => void sync(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  });

  return {
    changes,
    running,
    error: syncError ?? poll.error?.message,
    sync,
  };
}
