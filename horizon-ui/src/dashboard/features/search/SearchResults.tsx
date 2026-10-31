import { useState } from "react";
import { RiArrowDownSLine, RiArrowUpSLine } from "@remixicon/react";
import type { Collection, Prompt } from "@/api/generated/public/horizonAPI";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/api/http";
import CollectionPreview from "./CollectionPreview";
import SaveButton from "./SaveButton";
import { authorOf, type Author } from "./search.author";
import {
  usePublicCollections,
  usePublicPrompts,
  type SearchFilter,
} from "./search.queries";
import { useSaveToLibrary } from "./useSaveToLibrary";

interface ResultsProps {
  filter: SearchFilter;
  onAuthor: (author: Author) => void;
}

interface PagedQuery {
  isPending: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
}

// What every list shows around its items: progress, failure and more to load.
function PagedStatus({
  query,
  isEmpty,
}: {
  query: PagedQuery;
  isEmpty: boolean;
}) {
  if (query.isPending) return <p>Loading…</p>;
  if (query.error) {
    return (
      <p role="alert" className="text-destructive">
        {query.error instanceof ApiError && query.error.status === 401
          ? "Log in again to search."
          : query.error.message}
      </p>
    );
  }
  return (
    <>
      {isEmpty && <p>Nothing found.</p>}
      {query.hasNextPage && (
        <Button
          type="button"
          variant="secondary"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </>
  );
}

function AuthorButton({
  item,
  onAuthor,
}: {
  item: Collection | Prompt;
  onAuthor: (author: Author) => void;
}) {
  const author = authorOf(item);
  return (
    <Button
      type="button"
      variant="link"
      className="text-foreground underline"
      title="Only show this author"
      onClick={() => onAuthor(author)}
    >
      {author.name}
    </Button>
  );
}

export function PromptResults({ filter, onAuthor }: ResultsProps) {
  const query = usePublicPrompts(filter);
  const { savePrompt } = useSaveToLibrary();
  const prompts = query.data?.pages.flat() ?? [];

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {prompts.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prompt</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((prompt) => (
              <TableRow key={String(prompt.promptId)}>
                <TableCell>{prompt.promptText}</TableCell>
                <TableCell>{prompt.type}</TableCell>
                <TableCell>
                  <AuthorButton item={prompt} onAuthor={onAuthor} />
                </TableCell>
                <TableCell>
                  <SaveButton
                    label="Save to your library"
                    onSave={() => savePrompt(prompt)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <PagedStatus query={query} isEmpty={prompts.length === 0} />
    </div>
  );
}

function CollectionResult({
  collection,
  onAuthor,
}: {
  collection: Collection;
  onAuthor: (author: Author) => void;
}) {
  const [open, setOpen] = useState(false);
  const { saveCollection } = useSaveToLibrary();

  return (
    <li className="flex flex-col gap-2 rounded-md border p-2">
      <div className="flex items-center gap-2">
        <span className="grow font-semibold">{collection.name}</span>
        <AuthorButton item={collection} onAuthor={onAuthor} />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-expanded={open}
          aria-label={open ? "Hide prompts" : "Show prompts"}
          title={open ? "Hide prompts" : "Show prompts"}
          onClick={() => setOpen(!open)}
        >
          {open ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
        </Button>
        <SaveButton
          label="Save with its prompts to your library"
          onSave={() => saveCollection(collection)}
        />
      </div>
      {open && (
        <CollectionPreview collectionId={Number(collection.collectionId)} />
      )}
    </li>
  );
}

export function CollectionResults({ filter, onAuthor }: ResultsProps) {
  const query = usePublicCollections(filter);
  const collections = query.data?.pages.flat() ?? [];

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {collections.length > 0 && (
        <ul className="flex w-full flex-col gap-2">
          {collections.map((collection) => (
            <CollectionResult
              key={String(collection.collectionId)}
              collection={collection}
              onAuthor={onAuthor}
            />
          ))}
        </ul>
      )}
      <PagedStatus query={query} isEmpty={collections.length === 0} />
    </div>
  );
}
