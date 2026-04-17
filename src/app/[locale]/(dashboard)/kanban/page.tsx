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
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 group-hover:text-[#1B3A6B] transition-colors">
        {ticket.title}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 font-mono">#{ticket.ticketNumber}</span>
        <span className={`flex items-center gap-1 text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? 'text-gray-300'}`}>
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
            <path d="M2 2h10l-2 4 2 4H2V2z" />
          </svg>
          {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {ticket.assignedTo ? (
          <div
            className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center flex-shrink-0"
            title={ticket.assignedTo}
          >
            <span className="text-[10px] font-bold text-white">{inits(ticket.assignedTo)}</span>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" title="Sin asignar" />
        )}
        <span className="text-xs text-gray-400 ml-auto">{dateStr}</span>
      </div>
    </div>
  )
}

function AssigneeFilters({ tickets }: { tickets: GDeskTicket[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assignee = searchParams.get('assignee') ?? ''

  const assignees = useMemo(() => {
    const names = new Set<string>()
    tickets.forEach(t => { if (t.assignedTo) names.add(t.assignedTo) })
    return Array.from(names).sort()
  }, [tickets])

  if (assignees.length === 0) return null

  function toggle(name: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (assignee === name) {
      params.delete('assignee')
    } else {
      params.set('assignee', name)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {assignees.map(name => {
        const active = assignee === name
        return (
          <button
            key={name}
            onClick={() => toggle(name)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              active
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B3A6B] hover:text-[#1B3A6B]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${active ? 'bg-white/20' : 'bg-[#1B3A6B]'}`}>
              <span className={active ? 'text-white' : 'text-white'}>{inits(name)}</span>
            </div>
            {name}
          </button>
        )
      })}
    </div>
  )
}

function KanbanBoard() {
  const { tickets, loading } = useTickets()
  const router = useRouter()
  const { locale } = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const q        = searchParams.get('q')?.toLowerCase() ?? ''
  const month    = searchParams.get('month') ?? ''
  const assignee = searchParams.get('assignee') ?? ''

  // Tickets filtered only by month (for assignee button list)
  const byMonth = useMemo(() => {
    if (!month) return tickets
    return tickets.filter(t => {
      const d = new Date(t.createdAt)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return v === month
    })
  }, [tickets, month])

  const filtered = useMemo(() => {
    let result = byMonth
    if (q) {
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        (t.assignedTo ?? '').toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        (PRIORITY_LABELS[t.priority] ?? '').toLowerCase().includes(q)
      )
    }
    if (assignee) {
      result = result.filter(t => t.assignedTo === assignee)
    }
    return result
  }, [byMonth, q, assignee])

  const grouped = useMemo(() =>
    COLUMNS.reduce<Record<string, GDeskTicket[]>>((acc, col) => {
      acc[col.key] = filtered.filter(t => t.status === col.key)
      return acc
    }, {}),
    [filtered]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)}
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="flex-shrink-0 w-80 space-y-3">
              <Skeleton className="h-9 w-full rounded-full" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AssigneeFilters tickets={byMonth} />

      <div className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-240px)]">
        {COLUMNS.map(col => {
          const items = grouped[col.key] ?? []
          return (
            <div key={col.key} className="flex-shrink-0 w-80 flex flex-col">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{ backgroundColor: col.color }}
              >
                <span className="text-xs font-bold tracking-wider text-white truncate flex-1">
                  {col.label}
                </span>
                <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full flex-shrink-0">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
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
