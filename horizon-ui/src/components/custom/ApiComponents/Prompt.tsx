"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { type CollectionTableFeatures } from "./collection-table-features";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Prompt = {
  promptId: number;
  promptText: string;
  type: "question" | "action" | "group-action";
  creationDate: Date;
};

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<CollectionTableFeatures, Prompt>();

export const columns = columnHelper.columns([
  columnHelper.accessor("type", {
    header: "Type",
  }),
  columnHelper.accessor("creationDate", {
    header: "Created",
  }),
  columnHelper.accessor("promptText", {
    header: "Prompt",
  }),
]);
