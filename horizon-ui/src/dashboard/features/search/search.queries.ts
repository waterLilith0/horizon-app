import {
  getApiCollection,
  getApiCollectionAllCollectionId,
  getApiLibraryVersionPublic,
  getApiPrompt,
  ListScope,
  type GetApiPromptParams,
} from "@/api/generated/public/horizonAPI";
import { ok } from "@/api/http";
import { PUBLIC_POLL_MS } from "@/api/polling";
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const PAGE_SIZE = 20;

// What the public lists were at the last check.
let lastPublicVersion: string | undefined;

// Checks now and then whether anything public changed, and has everything
// found refreshed when it did. The query only schedules the check: it pauses
// while the tab is hidden, and catches up on return.
export function useRefreshOnPublicChange() {
  const queryClient = useQueryClient();
  useQuery({
    queryKey: ["public-version"],
    queryFn: async ({ signal }) => {
      const { version } = ok(await getApiLibraryVersionPublic({ signal }));
      if (lastPublicVersion !== undefined && lastPublicVersion !== version) {
        void queryClient.invalidateQueries({ queryKey: ["search"] });
      }
      lastPublicVersion = version;
      return version;
    },
    staleTime: PUBLIC_POLL_MS,
    refetchInterval: PUBLIC_POLL_MS,
    retry: false,
  });
}

export type SearchFilter = Pick<GetApiPromptParams, "search" | "userId">;
type PageParams = Pick<
  GetApiPromptParams,
  "page" | "pageSize" | "scope" | "search" | "userId"
>;

// Pages through what other users made public.
function usePublicPages<T>(
  kind: string,
  filter: SearchFilter,
  fetchPage: (params: PageParams, signal: AbortSignal) => Promise<T[]>,
) {
  return useInfiniteQuery({
    queryKey: ["search", kind, filter],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPage(
        {
          ...filter,
          page: pageParam,
          pageSize: PAGE_SIZE,
          scope: ListScope.Others,
        },
        signal,
      ),
    getNextPageParam: (last, _all, page) =>
      last.length === PAGE_SIZE ? page + 1 : undefined,
  });
}

export const usePublicPrompts = (filter: SearchFilter) =>
  usePublicPages("prompts", filter, async (params, signal) =>
    ok(await getApiPrompt(params, { signal })),
  );

export const usePublicCollections = (filter: SearchFilter) =>
  usePublicPages("collections", filter, async (params, signal) =>
    ok(await getApiCollection(params, { signal })),
  );

export const collectionPromptsQuery = (collectionId: number) =>
  queryOptions({
    queryKey: ["search", "collection", collectionId],
    queryFn: async ({ signal }) =>
      ok(await getApiCollectionAllCollectionId(collectionId, { signal })),
  });

export const useCollectionPrompts = (collectionId: number) =>
  useQuery(collectionPromptsQuery(collectionId));
