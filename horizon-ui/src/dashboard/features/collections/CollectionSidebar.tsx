import { useState } from "react";
import { Link } from "react-router";
import {
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiSearchLine,
} from "@remixicon/react";
import { DeleteDialog } from "@/components/action-dialog";
import {
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { withId } from "@/shared/format";
import type { LocalCollection } from "./collection.schema";
import CreateCollectionForm from "./CreateCollectionForm";

interface CollectionSidebarProps {
  collections: LocalCollection[];
  // No selected collection means the view of all prompts.
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => void;
}

// What the sidebar offers on the library page: the way to search, and the
// views of the user's collections.
export default function CollectionSidebar({
  collections,
  selectedId,
  onSelect,
  onSelectAll,
  onDelete,
  onCreate,
}: CollectionSidebarProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const [pendingDelete, setPendingDelete] = useState<LocalCollection | null>(
    null,
  );

  // The sidebar is a menu, so it closes once a choice was made in it.
  function choose(action?: () => void) {
    action?.();
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  }

  function confirmDelete() {
    if (pendingDelete) onDelete(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/search" />}
              onClick={() => choose()}
            >
              <RiSearchLine />
              <span>Search public prompts</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarHeader>All Collections</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selectedId === undefined}
                aria-current={selectedId === undefined ? "true" : undefined}
                onClick={() => choose(onSelectAll)}
              >
                <span>All prompts</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {collections.map((collection) => (
              <SidebarMenuItem key={collection.id}>
                <SidebarMenuButton
                  isActive={collection.id === selectedId}
                  aria-current={
                    collection.id === selectedId ? "true" : undefined
                  }
                  className={
                    collection.missing ? "text-destructive" : undefined
                  }
                  title={
                    collection.missing
                      ? "The server no longer has this collection"
                      : undefined
                  }
                  onClick={() => choose(() => onSelect(collection.id))}
                >
                  {collection.missing && <RiErrorWarningLine />}
                  <span>{withId(collection.name, collection.serverId)}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  className="hover:bg-destructive"
                  type="button"
                  aria-label={`Delete ${collection.name}`}
                  onClick={() => setPendingDelete(collection)}
                >
                  <RiDeleteBinLine />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <CreateCollectionForm onCreate={onCreate} />

      <DeleteDialog
        open={pendingDelete !== null}
        title="Delete collection?"
        description={`“${pendingDelete?.name ?? ""}” and the prompts that are in no other collection will be removed. This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
