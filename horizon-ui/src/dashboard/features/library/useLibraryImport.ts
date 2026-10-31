import { useEffect, useState } from "react";
import { useSetAtom, useStore } from "jotai";
import { useUploadContext } from "@uploadcn/react";
import { parseLibraryFile } from "./library.file";
import { findDuplicates, mergeLibrary } from "./library.merge";
import type { LibraryFile } from "./library.schema";
import { libraryAtom } from "./library.store";

export interface DuplicateCounts {
  collections: number;
  prompts: number;
}

interface PendingImport {
  file: LibraryFile;
  targetId: string | undefined;
  duplicates: DuplicateCounts;
}

// Imports each JSON file the app-wide uploader receives. Prompts that come
// without a collection join the target, or stand alone when there is none. A
// file that clashes with existing items waits for the user's decision.
export function useLibraryImport(targetId: string | undefined) {
  const { uploader } = useUploadContext();
  const store = useStore();
  const setLibrary = useSetAtom(libraryAtom);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [error, setError] = useState<string>();

  useEffect(
    () =>
      uploader.on("success", ({ item }) => {
        async function importItem() {
          setError(undefined);
          try {
            const file = parseLibraryFile(await item.file.text());
            const found = findDuplicates(
              store.get(libraryAtom),
              file,
              targetId,
            );
            const duplicates = {
              collections: found.collections.length,
              prompts: found.prompts.length,
            };
            if (duplicates.collections + duplicates.prompts > 0) {
              setPending({ file, targetId, duplicates });
            } else {
              setLibrary((library) =>
                mergeLibrary(library, file, targetId, false),
              );
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : "Import failed.");
          } finally {
            // Otherwise the same file would be rejected as already queued.
            uploader.remove(item.id);
          }
        }
        void importItem();
      }),
    [uploader, store, setLibrary, targetId],
  );

  function resolve(skipDuplicates: boolean) {
    if (!pending) return;
    setLibrary((library) =>
      mergeLibrary(library, pending.file, pending.targetId, skipDuplicates),
    );
    setPending(null);
  }

  return {
    duplicates: pending?.duplicates ?? null,
    error,
    skipDuplicates: () => resolve(true),
    keepBoth: () => resolve(false),
    cancel: () => setPending(null),
    dismissError: () => setError(undefined),
  };
}
