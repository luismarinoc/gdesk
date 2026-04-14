'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge'
import type { GDeskTicket } from '@/types'

interface TicketsTableProps {
  tickets: GDeskTicket[]
  loading: boolean
}

export function TicketsTable({ tickets, loading }: TicketsTableProps) {
  const t = useTranslations('tickets')
  const tc = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return tickets
      .filter(t => statusFilter === 'all' || t.status === statusFilter)
      .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
      .filter(t =>
        !globalFilter ||
        t.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(globalFilter.toLowerCase())
      )
  }, [tickets, statusFilter, priorityFilter, globalFilter])

  const columns = useMemo<ColumnDef<GDeskTicket>[]>(() => [
    { accessorKey: 'ticketNumber', header: t('number'), size: 80 },
    { accessorKey: 'title', header: t('titleCol') },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ getValue }) => <TicketStatusBadge status={getValue<GDeskTicket['status']>()} />,
    },
    {
      accessorKey: 'priority',
      header: t('priority'),
      cell: ({ getValue }) => <TicketPriorityBadge priority={getValue<GDeskTicket['priority']>()} />,
    },
    {
      accessorKey: 'assignedTo',
      header: t('assignedTo'),
      cell: ({ getValue }) => (getValue<string | null>() ?? '—'),
    },
    {
      accessorKey: 'createdAt',
      header: t('date'),
      cell: ({ getValue }) => (getValue<Date>()).toLocaleDateString(),
    },
  ], [t])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder={t('search')}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterByStatus')}</SelectItem>
            <SelectItem value="open">{t('statuses.open')}</SelectItem>
            <SelectItem value="in_progress">{t('statuses.in_progress')}</SelectItem>
            <SelectItem value="resolved">{t('statuses.resolved')}</SelectItem>
            <SelectItem value="closed">{t('statuses.closed')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('filterByPriority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterByPriority')}</SelectItem>
            <SelectItem value="urgent">{t('priorities.urgent')}</SelectItem>
            <SelectItem value="high">{t('priorities.high')}</SelectItem>
            <SelectItem value="normal">{t('priorities.normal')}</SelectItem>
            <SelectItem value="low">{t('priorities.low')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b bg-gray-50">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/${locale}/tickets/${row.original.id}`)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  {tc('noResults')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <span className="text-sm text-gray-500">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </span>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={v => table.setPageSize(Number(v ?? 20))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[20, 50, 100].map(size => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
