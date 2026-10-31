import { createColumnHelper } from "@tanstack/react-table";
import { RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import type { LocalCollection } from "../collections/collection.schema";
import PublishButton from "../sync/PublishButton";
import MovePromptMenu from "./MovePromptMenu";
import { PROMPT_TYPES, type LocalPrompt } from "./prompt.schema";
import PromptTextCell from "./PromptTextCell";
import type { PromptTableFeatures } from "./PromptTable";

interface PromptColumnHandlers {
  updateText: (id: string, text: string) => void;
  updateType: (id: string, type: LocalPrompt["type"]) => void;
  movePrompt: (id: string, collectionId: string | undefined) => void;
  publishPrompt: (prompt: LocalPrompt, isPublic: boolean) => Promise<void>;
  deletePrompt: (id: string) => void;
}

interface PromptColumnOptions {
  collections: LocalCollection[];
  // Only useful when prompts of several collections are listed together.
  showCollection: boolean;
}

export function createPromptColumns(
  {
    updateText,
    updateType,
    movePrompt,
    publishPrompt,
    deletePrompt,
  }: PromptColumnHandlers,
  { collections, showCollection }: PromptColumnOptions,
) {
  const columnHelper = createColumnHelper<PromptTableFeatures, LocalPrompt>();

  return columnHelper.columns([
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all prompts"
          checked={table.getIsAllRowsSelected()}
          indeterminate={
            table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
          }
          // A dash instead of the check while only some rows are selected.
          className="data-indeterminate:before:h-0.5 data-indeterminate:before:w-2 data-indeterminate:before:rounded-full data-indeterminate:before:bg-current data-indeterminate:[&_svg]:hidden"
          onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select prompt"
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      ),
    }),
    columnHelper.display({
      header: "Prompt",
      cell: ({ row }) => (
        <PromptTextCell
          id={row.original.id}
          value={row.original.promptText}
          onSave={updateText}
        />
      ),
    }),
    columnHelper.display({
      header: "Type",
      cell: ({ row }) => {
        const { id, type } = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger>{type}</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {PROMPT_TYPES.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => {
                      if (option !== type) updateType(id, option);
                    }}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
    ...(showCollection
      ? [
          columnHelper.display({
            header: "Collection",
            cell: ({ row }) =>
              collections.find((c) => c.id === row.original.collectionId)
                ?.name ?? "—",
          }),
        ]
      : []),
    columnHelper.display({
      header: "Created",
      cell: ({ row }) => {
        const value = new Date(row.original.creationDate);
        return (
          <Field>
            <FieldLabel>
              {Date.now() - 24 * 60 * 60 * 1000 < value.getTime()
                ? value.toLocaleTimeString()
                : value.toLocaleString()}
            </FieldLabel>
          </Field>
        );
      },
    }),
    columnHelper.display({
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MovePromptMenu
            label="Move to collection"
            iconOnly
            collections={collections.filter(
              (c) => c.id !== row.original.collectionId,
            )}
            canRemove={row.original.collectionId !== undefined}
            onMove={(collectionId) => movePrompt(row.original.id, collectionId)}
          />
          <PublishButton
            iconOnly
            isPublic={row.original.public}
            onToggle={() => publishPrompt(row.original, !row.original.public)}
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Delete prompt"
            title="Delete prompt"
            onClick={() => deletePrompt(row.original.id)}
          >
            <RiDeleteBinLine />
          </Button>
        </div>
      ),
    }),
  ]);
}
