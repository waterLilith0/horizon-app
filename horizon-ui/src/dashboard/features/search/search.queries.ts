import {
  getApiCollection,
  getApiCollectionAllCollectionId,
  getApiPrompt,
  ListScope,
  type GetApiPromptParams,
} from "@/api/generated/public/horizonAPI";
import { ok } from "@/api/http";
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

const PAGE_SIZE = 20;

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
