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

export const PromptSchema = z.object({
  promptId: z.int(),
  promptText: z.string(),
  type: z.enum(["question", "action"]),
  creationDate: z.date(),
});

export type PromptValues = z.infer<typeof PromptSchema>;

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<
  CollectionTableFeatures,
  PromptValues
>();

export const columns = columnHelper.columns([
  columnHelper.display({
    header: "Prompt",
    cell: ({ row }) => {
      const value = row.original.promptText;

      const [isEditing, setIsEditing] = useState(false);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        if (isEditing) {
          inputRef.current?.focus();
        }
      }, [isEditing]);

      return (
        <Field onClick={() => setIsEditing(true)} className="w-1/2">
          {isEditing ? (
            <Field orientation="horizontal">
              <Input id="promptText" placeholder={value} required />
            </Field>
          ) : (
            <>
              <FieldLabel htmlFor="promptText">{value}</FieldLabel>
            </>
          )}
        </Field>
      );
    },
  }),
  columnHelper.display({
    header: "Type",
    cell: ({ row }) => {
      const value = row.original.type;

      const [isEditing, setIsEditing] = useState(false);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        if (isEditing) {
          inputRef.current?.focus();
        }
      }, [isEditing]);

      return (
        <Field onClick={() => setIsEditing(true)}>
          {isEditing ? (
            <Field orientation="horizontal">
              <Input id="promptText" placeholder={value} required />
            </Field>
          ) : (
            <>
              <FieldLabel htmlFor="promptText">{value}</FieldLabel>
            </>
          )}
        </Field>
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
      const value = row.original.promptId;
      return (
        <Button>
          <FontAwesomeIcon
            icon={faTrash}
            className="text-accent-foreground dark:text-secondary"
          />
        </Button>
      );
    },
  }),
]);
