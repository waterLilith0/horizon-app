import type { Prompt } from "@/api/generated/public/schemas";
import type { DataTableFeatures } from "@/components/table-features";
import { Button } from "@/components/ui/button";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import {
  createColumnHelper,
  filterFn_equalsString,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper<DataTableFeatures, Prompt>();

export const promptColumns = columnHelper.columns([
  columnHelper.accessor("promptText", {
    header: ({ column }) => {
      return (
        <>
          {column.getIsSorted() === false ? (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting()}
              render={<button>Prompts</button>}
            />
          ) : (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting()}
              render={
                <button>
                  Prompts
                  {column.getIsSorted() === "asc" ? (
                    <RiArrowUpLine />
                  ) : (
                    <RiArrowDownLine />
                  )}
                </button>
              }
            />
          )}
        </>
      );
    },
    cell: ({ renderValue }) => {
      let text: string | null = renderValue();
      let edit: boolean = false;

      return edit ? (
        <div>TEST</div>
      ) : (
        <div className="w-full" onClick={() => (edit = !edit)}>
          {text}
        </div>
      );
    },
  }),
  columnHelper.accessor("type", {
    filterFn: filterFn_equalsString,
    header: () => <div className="w-8 shrink">Type</div>,
    cell: ({ renderValue }) => (
      <div className="w-5 shrink">{renderValue()}</div>
    ),
  }),
]);
