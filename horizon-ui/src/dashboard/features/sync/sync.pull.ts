import {
  getApiCollection,
  getApiLibraryVersion,
  getApiPrompt,
  ListScope,
} from "@/api/generated/public/horizonAPI";
import { ok } from "@/api/http";
import { exclusive, type LibraryAccess } from "./sync.access";
import { applyPull } from "./sync.state";

const PAGE_SIZE = 100;

async function fetchAll<T>(fetchPage: (page: number) => Promise<T[]>) {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const items = await fetchPage(page);
    all.push(...items);
    if (items.length < PAGE_SIZE) return all;
  }
}

async function fetchOwned() {
  const params = { pageSize: PAGE_SIZE, scope: ListScope.Owned };
  const collections = await fetchAll(async (page) =>
    ok(await getApiCollection({ ...params, page })),
  );
  const prompts = await fetchAll(async (page) =>
    ok(await getApiPrompt({ ...params, page, includeCollectionIds: true })),
  );
  return { collections, prompts };
}

// The version of the account's library the library here last took in.
let taken: { account: LibraryAccess["account"]; version: string } | undefined;

// Loads everything the account owns, and only then changes the library, so a
// failure half-way leaves it alone. The lists are only asked for when the
// server's version of them differs from the last one taken in. It is read
// before the lists, so a change made while they load is picked up next time.
export async function pullLibrary(access: LibraryAccess) {
  const { version } = ok(await getApiLibraryVersion());
  if (taken && taken.account === access.account && taken.version === version) {
    return;
  }

  const server = await fetchOwned();
  access.update((library) => applyPull(library, server));
  taken = { account: access.account, version };
}

export const pullServerItems = (access: LibraryAccess) =>
  exclusive(() => pullLibrary(access));
