import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { features, type DataTableFeatures } from "./table-features";
import { Button } from "./ui/button";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  RiArrowLeftDoubleLine,
  RiArrowLeftLine,
  RiArrowRightDoubleLine,
  RiArrowRightLine,
  RiSaveLine,
} from "@remixicon/react";
import { Input } from "./ui/input";
import { PROMPT_TYPES } from "@/pages/Dashboard";
import { Form } from "@base-ui/react";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
}

const fixedColumnWidths: Record<string, string> = {
  select: "1.5rem",
  type: "6rem",
  actions: "3rem",
};

export function DataTable<TData extends RowData>({
  columns,
  data,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });
  const [itemText, setItemText] = useState("");
  const [itemType, setItemType] = useState("");
  console.log(itemType);

  return (
    <div>
      <div className="flex flex-row w-full">
        <Tabs
          defaultValue="my_collections"
          className="w-35 overflow-x-auto min-w-0 flex-1"
        >
          <TabsList variant="line" className="bg-primary border">
            <TabsTrigger value="my_collections">My Collections</TabsTrigger>
            <TabsTrigger value="my_prompts">My Prompts</TabsTrigger>
            <TabsTrigger value="shared_collections">
              Shared Collections
            </TabsTrigger>
            <TabsTrigger value="shared_prompts">Shared Prompts</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto flex flex-row w-max">
          {table.getIsSomeRowsSelected() ? (
            <>
              <Button variant="secondary" render={<button>Export</button>} />
              <Button variant="secondary" render={<button>Publish</button>} />
              <Button variant="destructive" render={<button>Delete</button>} />
            </>
          ) : (
            <>
              <Input
                placeholder="Search"
                value={
                  (table.getColumn("promptText")?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) =>
                  table
                    .getColumn("promptText")
                    ?.setFilterValue(event.target.value)
                }
                className="w-60 shrink-0"
              />

              <Select
                value={
                  (table.getColumn("type")?.getFilterValue() as string) ?? ""
                }
                onValueChange={(value) => {
                  table.getColumn("type")?.setFilterValue(value);
                }}
              >
                <SelectTrigger className="h-8 w-17.5">
                  <SelectValue placeholder={"type"} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="">All Types</SelectItem>
                  {...PROMPT_TYPES.map((promptType) => (
                    <SelectItem key={promptType} value={`${promptType}`}>
                      {promptType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        fixedColumnWidths[header.column.id]
                          ? { width: fixedColumnWidths[header.column.id] }
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <TableRow className="">
              <TableCell />
              <TableCell className="w-fit">
                <Form
                  onSubmit={(event) => {
                    event.preventDefault();
                    console.log(itemText);
                    setItemText("");
                  }}
                >
                  <Input
                    className="w-fit"
                    placeholder="Enter new item text here"
                    onChange={(event) => setItemText(event.target.value)}
                    value={itemText}
                  />
                </Form>
              </TableCell>
              <TableCell>
                <Select
                  value={itemType}
                  onValueChange={(value) => {
                    if (typeof value === "string") setItemType(value);
                  }}
                >
                  <SelectTrigger className="h-8 w-17.5">
                    <SelectValue placeholder={"type"} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {...PROMPT_TYPES.map((promptType) => (
                      <SelectItem key={promptType} value={`${promptType}`}>
                        {promptType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  render={
                    <button>
                      <RiSaveLine />
                    </button>
                  }
                />
              </TableCell>
            </TableRow>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  style={
                    fixedColumnWidths[row.id]
                      ? { width: fixedColumnWidths[row.id] }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex items-center justify-between px-2">
          {table.getIsSomeRowsSelected() ? (
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          ) : null}

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <Select
                value={`${table.state.pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-17.5">
                  <SelectValue placeholder={table.state.pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {table.getPageCount() > 0 ? (
              <div className="flex w-25 items-center justify-center text-sm font-medium">
                Page {table.state.pagination.pageIndex + 1}/
                {table.getPageCount()}
              </div>
            ) : null}

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <RiArrowLeftDoubleLine />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <RiArrowLeftLine />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <RiArrowRightLine />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <RiArrowRightDoubleLine />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
