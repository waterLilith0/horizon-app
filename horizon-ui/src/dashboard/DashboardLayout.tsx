import { useApplyTheme } from "@/shared/theme/useResolvedTheme";
import { Outlet } from "react-router";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import AccountDropdown from "@/dashboard/features/account/AccountDropdown";
import { useState } from "react";
import Footer from "@/shared/Footer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CollectionValues } from "./features/collections/collection.schema";
import { CollectionsSidebar } from "./features/collections/CollectionsSidebar";
import { cn } from "cn";

const initialCollections: CollectionValues[] = [
  { collectionId: 0, name: "Test", creationDate: new Date() },
  { collectionId: 1, name: "Second", creationDate: new Date() },
];

function FloatingSidebarTrigger() {
  const { open } = useSidebar();
  return (
    <SidebarTrigger
      className={cn(
        "fixed left-2 z-10 dark:bg-white dark:text-black bg-black text-white transition-[left] duration-200 ease-linear",
        open ? "md:left-[calc(var(--sidebar-width)+0.5rem)]" : "",
      )}
      size={"lg"}
    />
  );
}
const queryClient = new QueryClient();

function DashboardLayout() {
  useApplyTheme();

  const [collections, setCollections] =
    useState<CollectionValues[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState(
    initialCollections[0]?.collectionId ?? 0,
  );

  function createCollection(name: string) {
    const collectionId =
      collections.reduce((max, c) => Math.max(max, c.collectionId), -1) + 1;

    setCollections([
      ...collections,
      { collectionId, name, creationDate: new Date() },
    ]);
    setSelectedCollection(collectionId);
  }

  function deleteCollection(id: number) {
    const remaining = collections.filter((c) => c.collectionId !== id);
    setCollections(remaining);
    if (id === selectedCollection) {
      setSelectedCollection(remaining[0]?.collectionId ?? 0);
    }
  }
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col text-[20px]">
        <AccountDropdown />
        <SidebarProvider>
          <CollectionsSidebar
            collections={collections}
            selectedId={selectedCollection}
            onSelect={setSelectedCollection}
            onDelete={deleteCollection}
            onCreate={createCollection}
          />
          <main className="flex flex-col bg-secondary items-center grow">
            <div className="flex flex-col items-center bg-primary w-[80%] p-2 overflow-hidden">
              <Outlet context={{ selectedCollection }} />
              <FloatingSidebarTrigger />
            </div>
          </main>
        </SidebarProvider>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

export default DashboardLayout;
