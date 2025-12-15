'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 border-b-2 border-[#DDDDDD] dark:border-[#000000]">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-10 w-full sm:max-w-sm bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-full sm:w-auto sm:ml-auto border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-[#262626]">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b-2 border-[#DDDDDD] dark:border-[#000000] hover:bg-transparent"
            >
              {headerGroup.headers.map((header, index) => {
                const isLast = index === headerGroup.headers.length - 1;
                return (
                  <TableHead
                    key={header.id}
                    className={
                      'h-12 px-4 font-bold text-[#262626] dark:text-white ' +
                      (isLast ? '' : 'border-r border-[#DDDDDD] dark:border-[#000000]')
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="border-b border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#262626] data-[state=selected]:bg-gray-50 dark:data-[state=selected]:bg-[#262626]"
              >
                {row.getVisibleCells().map((cell, index) => {
                  const isLast = index === row.getVisibleCells().length - 1;
                  return (
                    <TableCell
                      key={cell.id}
                      className={
                        'px-4 py-3 align-middle ' +
                        (isLast ? '' : 'border-r border-[#DDDDDD] dark:border-[#000000]')
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-gray-600 dark:text-gray-400">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#262626]">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1f1f1f]"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1f1f1f]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
