import { createColumnHelper } from "@tanstack/react-table";
import { type CollectionTableFeatures } from "../../../dashboard/features/collections/collection-table-features";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as z from "zod";
import { useEffect, useRef, useState } from "react";
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

export const PROMPT_TYPES = ["question", "action", "group-action"] as const;

export const PromptSchema = z.object({
  promptId: z.int(),
  promptText: z.string(),
  type: z.enum(PROMPT_TYPES),
  creationDate: z.date(),
});

export type PromptValues = z.infer<typeof PromptSchema>;

type PromptColumnHandlers = {
  updateText: (id: number, text: string) => void;
  updateType: (id: number, type: PromptValues["type"]) => void;
  deletePrompt: (id: number) => void;
};

const PromptTextSchema = PromptSchema.shape.promptText;

function PromptTextCell({
  id,
  value,
  onSave,
}: {
  id: number;
  value: string;
  onSave: (id: number, text: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `prompt-text-${id}`;

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [isEditing, value]);

  function save() {
    const result = PromptTextSchema.safeParse(draft);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid prompt text");
      return;
    }

    if (result.data !== value) onSave(id, result.data);
    setError("");
    setIsEditing(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {isEditing ? (
        <>
          <Input
            ref={inputRef}
            id={inputId}
            value={draft}
            onChange={(event) => {
              setDraft(event.currentTarget.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setDraft(value);
                setError("");
                setIsEditing(false);
              }
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          {error && (
            <p id={`${inputId}-error`} role="alert">
              {error}
            </p>
          )}
        </>
      ) : (
        <button
          type="button"
          className="text-left"
          onClick={() => {
            setDraft(value);
            setIsEditing(true);
          }}
        >
          {value}
        </button>
      )}
    </form>
  );
}

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
            <FieldLabel htmlFor="creationDate">
              {new Date().setDate(new Date().getDate() - 1) < value.getTime()
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
