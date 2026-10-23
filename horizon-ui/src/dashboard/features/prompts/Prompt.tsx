import { createColumnHelper } from "@tanstack/react-table";
import { type CollectionTableFeatures } from "../collections/collection-table-features";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PROMPT_TYPES,
  type PromptColumnHandlers,
  type PromptValues,
} from "./prompt.schema";
import PromptTextCell from "./PromptTextCell";

export function createPromptColumns({
  updateText,
  updateType,
  deletePrompt,
}: PromptColumnHandlers) {
  const columnHelper = createColumnHelper<
    CollectionTableFeatures,
    PromptValues
  >();

  return columnHelper.columns([
    columnHelper.display({
      header: "Prompt",
      cell: ({ row }) => (
        <PromptTextCell
          id={row.original.promptId}
          value={row.original.promptText}
          onSave={updateText}
        />
      ),
    }),
    columnHelper.display({
      header: "Type",
      cell: ({ row }) => {
        const { promptId, type } = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger>{type}</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                {PROMPT_TYPES.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onSelect={() => {
                      if (option !== type) updateType(promptId, option);
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
    columnHelper.display({
      header: "Created",
      cell: ({ row }) => {
        const value = row.original.creationDate;
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
      cell: ({ row }) => {
        return (
          <Button
            type="button"
            onClick={() => deletePrompt(row.original.promptId)}
          >
            <FontAwesomeIcon
              icon={faTrash}
              className="text-accent-foreground dark:text-secondary"
            />
          </Button>
        );
      },
    }),
  ]);
}
