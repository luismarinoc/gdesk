'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge'
import type { GDeskTicket } from '@/types'

interface TicketsTableProps {
  tickets: GDeskTicket[]
  loading: boolean
  monthFilter?: string
}

export function TicketsTable({ tickets, loading, monthFilter = 'all' }: TicketsTableProps) {
  const t = useTranslations('tickets')
  const tc = useTranslations('common')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.toLowerCase() ?? ''
  const assignee = searchParams.get('assignee') ?? ''

  const filtered = useMemo(() => {
    return tickets
      .filter(t => {
        if (monthFilter === 'all') return true
        const d = new Date(t.createdAt)
        const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return v === monthFilter
      })
      .filter(t => !assignee || t.assignedTo === assignee)
      .filter(t =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        (t.assignedTo ?? '').toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      )
  }, [tickets, monthFilter, assignee, q])

  const columns = useMemo<ColumnDef<GDeskTicket>[]>(() => [
    {
      accessorKey: 'ticketNumber',
      header: t('number'),
      size: 80,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11.5px] text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5 whitespace-nowrap">
          #{getValue<string>()}
        </span>
      ),
    },
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
      cell: ({ getValue }) => new Date(getValue<Date>()).toLocaleDateString('es'),
    },
  ], [t])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
      <div className="flex items-center justify-end">
        <span className="text-xs text-gray-400">{filtered.length} tickets</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b bg-gray-50/80 sticky top-0 z-10">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
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
                className="border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition-colors"
                onClick={() => router.push(`/${locale}/tickets/${row.original.id}`)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-[13.5px]">
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

    </div>
  )
}
