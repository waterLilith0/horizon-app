import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
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
import type { CollectionValues } from "./collection.schema";
import { type SyntheticEvent } from "react";
import { CollectionNameSchema } from "./collection.schema";
import { DeleteDialog } from "./DeleteDialog";
import CreateFooter from "./CreateFooter";

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

      <CreateFooter
        handleCreate={handleCreate}
        newName={newName}
        setNewName={setNewName}
        createError={createError}
        setCreateError={setCreateError}
      />

      <DeleteDialog
        pendingDelete={pendingDelete}
        setPendingDelete={setPendingDelete}
        confirmDelete={confirmDelete}
      />
    </Sidebar>
  );
}
