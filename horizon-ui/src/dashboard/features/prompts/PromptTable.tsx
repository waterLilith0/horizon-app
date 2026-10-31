import {
  columnVisibilityFeature,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LocalPrompt } from "./prompt.schema";

// Anything not registered here is left out of the bundle.
const features = tableFeatures({
  columnVisibilityFeature,
  rowSelectionFeature,
});

// What the columns need to know about this table's features.
export type PromptTableFeatures = typeof features;

interface PromptTableProps {
  columns: ColumnDef<PromptTableFeatures, LocalPrompt>[];
  data: LocalPrompt[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
}

const FLEXIBLE_COLUMN = "Prompt";
const cellWidth = (id: string) =>
  id === FLEXIBLE_COLUMN ? "w-full" : "w-px whitespace-nowrap";

// TODO: don't show type and created when in mobile view
export default function PromptTable({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
}: PromptTableProps) {
  const table = useTable({
    features,
    data,
    columns,
    getRowId: (prompt) => prompt.id,
    state: { rowSelection },
    onRowSelectionChange,
  });

  return (
    <div className="overflow-hidden rounded-md border w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={cellWidth(header.id)}>
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cellWidth(cell.column.id)}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
