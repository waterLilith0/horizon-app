import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { CollectionValues } from "./Collection";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

interface SelectionProps {
  selectedCollection: number;
  setSelectedCollection(num: number): void;
}

export function AllCollections({
  selectedCollection,
  setSelectedCollection,
}: SelectionProps) {
  const mockData: CollectionValues[] = [
    {
      collectionId: 0,
      name: "Test",
      creationDate: new Date(),
    },
    {
      collectionId: 1,
      name: "Second",
      creationDate: new Date(),
    },
  ];

  function deleteCollection(collectionId: number) {}

  return (
    <Sidebar>
      <SidebarHeader>All Collections</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {mockData.map((data) => {
            return (
              <SidebarContent
                key={data.collectionId}
                className={`flex flex-row items-center justify-between gap-2 hover:bg-accent hover:cursor-pointer p-2 ${selectedCollection === data.collectionId ? "bg-primary hover:bg-primary" : ""}`}
                onClick={() => setSelectedCollection(data.collectionId)}
              >
                <p>{data.name}</p>
                <Button
                  className="bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCollection(data.collectionId);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faTrash}
                    className="text-sidebar-foreground"
                  />
                </Button>
              </SidebarContent>
            );
          })}
        </SidebarGroup>
        <SidebarSeparator></SidebarSeparator>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
