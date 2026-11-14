import { createColumnHelper } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/components/table-features";
import type { Prompt } from "@/api/generated/public/schemas";
import { Checkbox } from "@/components/ui/checkbox";

const columnHelper = createColumnHelper<DataTableFeatures, Prompt>();

export const selectionColumn = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
]);
