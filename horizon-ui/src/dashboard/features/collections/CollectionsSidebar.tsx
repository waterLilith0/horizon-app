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
import { useState } from "react";
import { CollectionNameSchema } from "./collection.schema";
import CreateFooter from "./CreateFooter";
import DeleteDialog from "./DeleteDialog";

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
}: CollectionsSidebarProps) {
  const [pendingDelete, setPendingDelete] = useState<CollectionValues | null>(
    null,
  );

  function handleCreate(name: string) {
    const result = CollectionNameSchema.safeParse(name);

    if (!result.success) {
      return;
    }
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

      <CreateFooter onCreate={handleCreate} />

      <DeleteDialog
        collection={pendingDelete}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Sidebar>
  );
}
