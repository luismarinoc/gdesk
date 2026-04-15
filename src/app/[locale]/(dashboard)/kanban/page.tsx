'use client'

import { Suspense, useMemo } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { MonthSelect } from '@/components/shared/MonthSelect'
import type { GDeskTicket } from '@/types'

const COLUMNS: { key: GDeskTicket['status']; label: string; color: string }[] = [
  { key: 'backlog',               label: 'BACKLOG',               color: '#787486' },
  { key: 'listo_para_trabajar',   label: 'LISTO PARA TRABAJAR',   color: '#e11d48' },
  { key: 'en_progreso',           label: 'EN PROGRESO',           color: '#4194f0' },
  { key: 'supervision_y_control', label: 'SUPERVISIÓN Y CONTROL', color: '#f97316' },
  { key: 'cerrado',               label: 'CERRADO',               color: '#22c55e' },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-500',
  high:   'text-orange-500',
  normal: 'text-blue-400',
  low:    'text-gray-300',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', normal: 'Normal', low: 'Baja',
}

function inits(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function KanbanCard({ ticket, onClick }: { ticket: GDeskTicket; onClick: () => void }) {
  const date = new Date(ticket.createdAt)
  const dateStr = date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <div onClick={onClick} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 space-y-2 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
      {/* Title */}
      <p className="text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-[#1B3A6B] transition-colors">
        {ticket.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Ticket number */}
        <span className="text-[11px] text-gray-400 font-mono">#{ticket.ticketNumber}</span>

        {/* Priority flag */}
        <span className={`flex items-center gap-0.5 text-[11px] font-medium ${PRIORITY_COLORS[ticket.priority] ?? 'text-gray-300'}`}>
          <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16">
            <path d="M2 2h10l-2 4 2 4H2V2z" />
          </svg>
          {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
        </span>
      </div>

      {/* Bottom row: assignee + date */}
      <div className="flex items-center gap-2">
        {ticket.assignedTo ? (
          <div
            className="w-5 h-5 rounded-full bg-[#1B3A6B] flex items-center justify-center flex-shrink-0"
            title={ticket.assignedTo}
          >
            <span className="text-[9px] font-bold text-white">{inits(ticket.assignedTo)}</span>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" title="Sin asignar" />
        )}
        <span className="text-[11px] text-gray-400 ml-auto">{dateStr}</span>
      </div>
    </div>
  )
}

function KanbanBoard() {
  const { tickets, loading } = useTickets()
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const q     = searchParams.get('q')?.toLowerCase() ?? ''
  const month = searchParams.get('month') ?? ''

  const filtered = useMemo(() => {
    let result = tickets
    if (month) {
      result = result.filter(t => {
        const d = new Date(t.createdAt)
        const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return v === month
      })
    }
    if (q) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        (t.assignedTo ?? '').toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        (PRIORITY_LABELS[t.priority] ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [tickets, q, month])

  const grouped = useMemo(() =>
    COLUMNS.reduce<Record<string, GDeskTicket[]>>((acc, col) => {
      acc[col.key] = filtered.filter(t => t.status === col.key)
      return acc
    }, {}),
    [filtered]
  )

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex-shrink-0 w-64 space-y-3">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
      {COLUMNS.map(col => {
        const items = grouped[col.key] ?? []
        return (
          <div key={col.key} className="flex-shrink-0 w-64 flex flex-col">
            {/* Column header — solid pill like ClickUp */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{ backgroundColor: col.color }}
            >
              <span className="text-[11px] font-bold tracking-wider text-white truncate flex-1">
                {col.label}
              </span>
              <span className="text-[11px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {items.map(ticket => (
                <KanbanCard key={ticket.id} ticket={ticket} onClick={() => router.push(`/${locale}/tickets/${ticket.id}`)} />
              ))}
              {items.length === 0 && (
                <div className="text-center py-10 text-xs text-gray-300">Sin tickets</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function KanbanPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tablero Kanban</h1>
        <Suspense fallback={null}>
          <MonthSelect />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <KanbanBoard />
      </Suspense>
    </div>
  )
}
