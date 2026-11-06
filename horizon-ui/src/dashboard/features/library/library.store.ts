import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  EMPTY_LIBRARY,
  LibrarySchema,
  upgradePrompts,
  type Library,
} from "./library.schema";

const storage = createJSONStorage<Library>(() => localStorage);

// Everything the user has made, kept in the browser between visits.
export const libraryAtom = atomWithStorage<Library>(
  "horizon-library",
  EMPTY_LIBRARY,
  {
    ...storage,
    // Stored data can be outdated or edited by hand, so it is checked on load.
    getItem: (key, initialValue) => {
      const result = LibrarySchema.safeParse(
        upgradePrompts(storage.getItem(key, initialValue)),
      );
      return result.success ? result.data : initialValue;
    },
  },
  { getOnInit: true },
);
