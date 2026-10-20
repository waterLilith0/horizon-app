import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CollectionValues } from "./collection.schema";
import { type SyntheticEvent } from "react";
import { Input } from "@/components/ui/input";
import { SidebarFooter } from "@/components/ui/sidebar"; // add to the existing sidebar import list
import { CollectionNameSchema } from "./collection.schema";

interface CollectionsSidebarProps {
  collections: CollectionValues[];
  selectedId: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

interface CollectionsSidebarProps {
  collections: CollectionValues[];
  selectedId: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onCreate: (name: string) => void;
}

export function CollectionsSidebar({
  collections,
  selectedId,
  onSelect,
  onDelete,
  onCreate,
}: CollectionsSidebarProps) {
  const [pendingDelete, setPendingDelete] = useState<CollectionValues | null>(
    null,
  );
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");

  function handleCreate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = CollectionNameSchema.safeParse(newName);

    if (!result.success) {
      setCreateError(result.error.issues[0]?.message ?? "Invalid name");
      return;
    }

    onCreate(result.data);
    setNewName("");
    setCreateError("");
  }

  function confirmDelete() {
    if (pendingDelete) onDelete(pendingDelete.collectionId);
    setPendingDelete(null);
  }

  return (
    <Sidebar>
      <SidebarHeader>All Collections</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {collections.map((collection) => (
              <SidebarMenuItem key={collection.collectionId}>
                <SidebarMenuButton
                  isActive={collection.collectionId === selectedId}
                  aria-current={
                    collection.collectionId === selectedId ? "true" : undefined
                  }
                  onClick={() => onSelect(collection.collectionId)}
                >
                  <span>{collection.name}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  type="button"
                  aria-label={`Delete ${collection.name}`}
                  onClick={() => setPendingDelete(collection)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

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
              aria-describedby={
                createError ? "new-collection-error" : undefined
              }
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete collection?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.name}” and all of its prompts will be removed.
              This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
