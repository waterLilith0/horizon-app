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
import CreateFooter from "./CreateFooter";
import DeleteDialog from "./DeleteDialog";
import { cn } from "cn";
import AccountDropdown from "../account/AccountDropdown";

interface CollectionsSidebarProps {
  collections: CollectionValues[];
  selectedId: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onCreate: (name: string) => void;
}

export function CustomSidebar({
  collections,
  selectedId,
  onSelect,
  onDelete,
  onCreate,
}: CollectionsSidebarProps) {
  const [pendingDelete, setPendingDelete] = useState<CollectionValues | null>(
    null,
  );

  function confirmDelete() {
    if (pendingDelete) onDelete(pendingDelete.collectionId);
    setPendingDelete(null);
  }

  return (
    <>
      <Sidebar side="right">
        <SidebarHeader>
          <SidebarContent>
            <AccountDropdown />
          </SidebarContent>
        </SidebarHeader>
        <SidebarHeader>All Collections</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {collections.map((collection) => (
                <SidebarMenuItem key={collection.collectionId}>
                  <SidebarMenuButton
                    isActive={collection.collectionId === selectedId}
                    aria-current={
                      collection.collectionId === selectedId
                        ? "true"
                        : undefined
                    }
                    className={cn(
                      "hover:not-[data-active]:bg-sidebar-primary",
                      collection.collectionId === selectedId
                        ? "data-active:bg-primary"
                        : "",
                    )}
                    onClick={() => {
                      onSelect(collection.collectionId);
                    }}
                  >
                    <span>{collection.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    className="hover:bg-destructive"
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

        <CreateFooter onCreate={onCreate} />

        <DeleteDialog
          collection={pendingDelete}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      </Sidebar>
    </>
  );
}
