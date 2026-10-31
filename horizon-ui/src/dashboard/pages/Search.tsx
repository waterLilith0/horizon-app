import { useState } from "react";
import { Link } from "react-router";
import { RiCloseLine, RiSearchLine } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Author } from "../features/search/search.author";
import {
  CollectionResults,
  PromptResults,
} from "../features/search/SearchResults";
import Page from "../layout/Page";

const KINDS = ["collections", "prompts"] as const;

export default function Search() {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("collections");
  // What is typed is only searched for once submitted.
  const [draft, setDraft] = useState("");
  const [term, setTerm] = useState("");
  const [author, setAuthor] = useState<Author>();

  const filter = { search: term || undefined, userId: author?.id };
  const Results = kind === "collections" ? CollectionResults : PromptResults;

  return (
    <Page>
      <div className="flex w-full flex-col items-center gap-2">
        <header className="flex w-full items-center justify-between p-2">
          <h1 className="text-xl font-semibold">Search</h1>
          <Link to="/" className={buttonVariants({ variant: "secondary" })}>
            My library
          </Link>
        </header>
        <form
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setTerm(draft.trim());
          }}
        >
          <Input
            aria-label="Search"
            placeholder="Search public prompts and collections"
            maxLength={100}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            <RiSearchLine />
            Search
          </Button>
        </form>
        <div className="flex w-full items-center gap-2">
          {KINDS.map((option) => (
            <Button
              key={option}
              type="button"
              variant={kind === option ? "secondary" : "ghost"}
              aria-pressed={kind === option}
              onClick={() => setKind(option)}
            >
              {option === "collections" ? "Collections" : "Prompts"}
            </Button>
          ))}
          {author && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAuthor(undefined)}
            >
              Author: {author.name}
              <RiCloseLine />
            </Button>
          )}
        </div>
        <Results filter={filter} onAuthor={setAuthor} />
      </div>
    </Page>
  );
}
