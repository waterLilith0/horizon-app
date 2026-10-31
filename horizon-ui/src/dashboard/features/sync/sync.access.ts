import { useSetAtom, useStore } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@/api/generated/internal/horizonInternal";
import { currentUserQueryKey, useCurrentUser } from "../auth/auth";
import { libraryAtom } from "../library/library.store";
import type { Library } from "../library/library.schema";

type Update = (change: (library: Library) => Library) => void;

// How the server actions reach the library. They read it when they run, not
// when they were requested, since other actions may have changed it by then.
// Once the account changes, an access is dead: queued actions stop and answers
// that arrive late are dropped, as their ids belong to the previous account.
export interface LibraryAccess {
  get: () => Library;
  update: Update;
}

export function useLibraryAccess(): LibraryAccess {
  const store = useStore();
  const queryClient = useQueryClient();
  const setLibrary = useSetAtom(libraryAtom);
  const { data: user } = useCurrentUser();
  const userId = user?.userId;

  function assertSameAccount() {
    const current = queryClient.getQueryData<UserProfile | null>(
      currentUserQueryKey,
    );
    if (current?.userId !== userId) {
      throw new Error("The account changed, so this was cancelled.");
    }
  }

  return {
    get: () => {
      assertSameAccount();
      return store.get(libraryAtom);
    },
    update: (change) => {
      assertSameAccount();
      setLibrary(change);
    },
  };
}

let queue: Promise<unknown> = Promise.resolve();

// Server actions run one at a time. Two at once could upload the same new item
// twice, as each would still see it as not uploaded.
export function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task);
  queue = result.catch(() => undefined);
  return result;
}
