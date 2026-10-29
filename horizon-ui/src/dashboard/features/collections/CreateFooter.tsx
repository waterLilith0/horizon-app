import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarFooter } from "@/components/ui/sidebar";
import { useState, type SyntheticEvent } from "react";
import { CollectionNameSchema } from "./collection.schema";
import { RiAddLine } from "@remixicon/react";

export default function CreateFooter({
  onCreate,
}: {
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = CollectionNameSchema.safeParse(name);
    if (!result.success)
      return setError(result.error.issues[0]?.message ?? "Invalid name");
    onCreate(result.data);
    setName("");
  }
  return (
    <SidebarFooter>
      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(event) => {
              setName(event.currentTarget.value);
              setError("");
            }}
            placeholder="New collection"
            aria-label="New collection name"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "new-collection-error" : undefined}
            maxLength={50}
          />
          <Button type="submit" aria-label="Create collection">
            <RiAddLine />
          </Button>
        </div>
        {error && (
          <p
            id="new-collection-error"
            role="alert"
            className="text-destructive"
          >
            {error}
          </p>
        )}
      </form>
    </SidebarFooter>
  );
}
