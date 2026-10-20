"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type CollectionTableFeatures } from "./collection-table-features";
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

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<
  CollectionTableFeatures,
  PromptValues
>();

function deleteTrigger(id: number) {
  console.log(id);
}

function updateText(id: number, newValue: string) {
  console.log(id);
  console.log(newValue);
}

function updateType(id: number, newValue: (typeof PROMPT_TYPES)[number]) {
  console.log(id);
  console.log(newValue);
}

export const columns = columnHelper.columns([
  columnHelper.display({
    header: "Prompt",
    cell: ({ row }) => {
      let value = row.original.promptText;
      const id = row.original.promptId;
      const [newValue, setNewValue] = useState("");

      const [isEditing, setIsEditing] = useState(false);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        if (isEditing) {
          inputRef.current?.focus();
        }
      }, [isEditing]);

      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newValue != value) {
              updateText(id, newValue);
              value = newValue;
            }
            setIsEditing(false);
          }}
        >
          <Field onClick={() => setIsEditing(true)} className="w-1/2">
            {isEditing ? (
              <Input
                id="promptText"
                placeholder={value}
                onKeyUp={(e) => setNewValue(e.currentTarget.value)}
              />
            ) : (
              <>
                <FieldLabel htmlFor="promptText">{value}</FieldLabel>
              </>
            )}
          </Field>
        </form>
      );
    },
  }),
  columnHelper.display({
    header: "Type",
    cell: ({ row }) => {
      const [value, setValue] = useState(row.original.type);
      const id = row.original.promptId;
      const [newValue, _] = useState(row.original.type);

      return (
        <form>
          <Field>
            <DropdownMenu>
              <DropdownMenuTrigger>{value}</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  {PROMPT_TYPES.map((type) => {
                    return (
                      <DropdownMenuItem
                        key={type}
                        onSelect={() => {
                          if (newValue != value) {
                            return;
                          }
                          updateType(id, newValue);
                          setValue(newValue);
                        }}
                      >
                        {type}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
        </form>
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
      const id = row.original.promptId;
      return (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            deleteTrigger(id);
          }}
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
