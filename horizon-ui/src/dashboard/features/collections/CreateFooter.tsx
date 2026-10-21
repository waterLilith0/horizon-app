import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarFooter } from "@/components/ui/sidebar";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { SyntheticEvent } from "react";

type CreateFooterProps = {
  handleCreate: (event: SyntheticEvent<HTMLFormElement>) => void;
  newName: string;
  setNewName: (e: string) => void;
  createError: string;
  setCreateError: (e: string) => void;
};

export default function CreateFooter({
  handleCreate,
  newName,
  setNewName,
  createError,
  setCreateError,
}: CreateFooterProps) {
  return (
    <SidebarFooter>
      <form onSubmit={handleCreate} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => {
              setNewName(event.currentTarget.value);
              setCreateError("");
            }}
            placeholder="New collection"
            aria-label="New collection name"
            aria-invalid={Boolean(createError)}
            aria-describedby={createError ? "new-collection-error" : undefined}
            maxLength={50}
          />
          <Button type="submit" aria-label="Create collection">
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </div>
        {createError && (
          <p
            id="new-collection-error"
            role="alert"
            className="text-destructive"
          >
            {createError}
          </p>
        )}
      </form>
    </SidebarFooter>
  );
}
