import { RiFolderAddLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { withId } from "@/shared/format";
import type { LocalCollection } from "../collections/collection.schema";

interface PromptCollectionsMenuProps {
  label: string;
  iconOnly?: boolean;
  collections: LocalCollection[];
  // Whether every prompt this menu is for is in the collection.
  isMember: (collectionId: string) => boolean;
  onToggle: (collectionId: string, member: boolean) => void;
}

// A prompt can be in any collection, so each one is switched on or off.
export default function PromptCollectionsMenu({
  label,
  iconOnly = false,
  collections,
  isMember,
  onToggle,
}: PromptCollectionsMenuProps) {
  if (collections.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="secondary"
            size={iconOnly ? "icon" : "default"}
            aria-label={label}
            title={label}
          />
        }
      >
        <RiFolderAddLine />
        {!iconOnly && label}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {collections.map((collection) => (
            <DropdownMenuCheckboxItem
              key={collection.id}
              checked={isMember(collection.id)}
              onCheckedChange={(member) => onToggle(collection.id, member)}
            >
              {withId(collection.name, collection.serverId)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
