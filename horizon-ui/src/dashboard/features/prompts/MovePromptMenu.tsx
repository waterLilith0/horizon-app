import { RiFolderTransferLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LocalCollection } from "../collections/collection.schema";

interface MovePromptMenuProps {
  label: string;
  iconOnly?: boolean;
  // The collections the prompts can move to.
  collections: LocalCollection[];
  // Whether leaving a collection, to stand alone, is on offer.
  canRemove: boolean;
  onMove: (collectionId: string | undefined) => void;
}

export default function MovePromptMenu({
  label,
  iconOnly = false,
  collections,
  canRemove,
  onMove,
}: MovePromptMenuProps) {
  if (collections.length === 0 && !canRemove) return null;

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
        <RiFolderTransferLine />
        {!iconOnly && label}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {collections.map((collection) => (
            <DropdownMenuItem
              key={collection.id}
              onClick={() => onMove(collection.id)}
            >
              {collection.name}
            </DropdownMenuItem>
          ))}
          {canRemove && (
            <DropdownMenuItem onClick={() => onMove(undefined)}>
              No collection
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
