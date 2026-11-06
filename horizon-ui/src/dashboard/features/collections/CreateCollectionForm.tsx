import type { SyntheticEvent } from "react";
import { RiAddLine } from "@remixicon/react";
import { FIELD_MAX } from "@/api/limits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarFooter } from "@/components/ui/sidebar";
import { useValidatedInput } from "@/shared/useValidatedInput";
import { CollectionNameSchema } from "./collection.schema";

export default function CreateCollectionForm({
  onCreate,
}: {
  onCreate: (name: string) => void;
}) {
  const name = useValidatedInput(CollectionNameSchema);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const valid = name.validate();
    if (valid === undefined) return;
    onCreate(valid);
    name.reset();
  }

  return (
    <SidebarFooter>
      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            value={name.value}
            onChange={(event) => name.change(event.currentTarget.value)}
            placeholder="New collection"
            aria-label="New collection name"
            aria-invalid={Boolean(name.error)}
            aria-describedby={name.error ? "new-collection-error" : undefined}
            maxLength={FIELD_MAX}
          />
          <Button type="submit" aria-label="Create collection">
            <RiAddLine />
          </Button>
        </div>
        {name.error && (
          <p
            id="new-collection-error"
            role="alert"
            className="text-destructive"
          >
            {name.error}
          </p>
        )}
      </form>
    </SidebarFooter>
  );
}
