'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown, Search } from 'lucide-react'

export interface Client {
  team: {
    id: string
    name: string
    clientCompanyName?: string
    industry?: string
    contactEmail?: string
    description?: string
    createdAt: string
  }
  profile?: {
    contentPillars?: string[]
  }
}

interface ClientsDataTableProps {
  clients: Client[]
}

export function ClientsDataTable({ clients }: ClientsDataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'team.clientCompanyName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Company Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const client = row.original
        
return (
          <div className="font-medium">
            {client.team.clientCompanyName || client.team.name}
          </div>
        )
      },
    },
    {
      accessorKey: 'team.industry',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Industry
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const industry = row.original.team.industry
        
return industry ? (
          <Badge variant="secondary">{industry}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
    },
    {
      accessorKey: 'team.contactEmail',
      header: 'Contact Email',
      cell: ({ row }) => {
        const email = row.original.team.contactEmail
        
return email ? (
          <span className="text-sm">{email}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
    },
    {
      accessorKey: 'team.description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.original.team.description
        
return description ? (
          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
            {description}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      },
    },
    {
      accessorKey: 'team.createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Created Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.original.team.createdAt)
        
return <span className="text-sm">{date.toLocaleDateString()}</span>
      },
    },
  ]

  const table = useReactTable({
    data: clients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={(table.getColumn('team_clientCompanyName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('team_clientCompanyName')?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {table.getFilteredRowModel().rows.length} {table.getFilteredRowModel().rows.length === 1 ? 'client' : 'clients'}
        </Badge>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
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
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/dashboard?team=${row.original.team.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
