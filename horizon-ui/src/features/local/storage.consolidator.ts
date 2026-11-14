import { useAtomValue } from "jotai";
import { collectionAtom } from "@/features/local/storage.atom";
import type {
  CollectionOutput,
  ProblemDetails,
} from "@/api/generated/public/schemas";

export function consolidateCollection(
  remoteCollection: CollectionOutput,
): void | { localId: number; remoteId: number; details: ProblemDetails } {
  const localCollections = useAtomValue(collectionAtom);

  localCollections.forEach((t) => {
    if (t.name === remoteCollection.name) {
      return {
        localId: t.collectionId,
        remoteId: remoteCollection.collectionId,
        details: {
          title: "Duplicate Collection",
          detail: `A collection with the name ${t.name} already exists in remote.`,
          status: 409,
        },
      };
    }
  });
}
