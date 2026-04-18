'use client'

import { Suspense, useMemo } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { MonthSelect } from '@/components/shared/MonthSelect'
import type { GDeskTicket } from '@/types'

const COLUMNS: { key: GDeskTicket['status']; label: string; color: string; bg: string }[] = [
  { key: 'backlog',               label: 'Backlog',               color: '#787486', bg: '#f3f4f6' },
  { key: 'listo_para_trabajar',   label: 'Listo para Trabajar',   color: '#e11d48', bg: '#ffe4e6' },
  { key: 'en_progreso',           label: 'En Progreso',           color: '#4194f0', bg: '#dbeafe' },
  { key: 'supervision_y_control', label: 'Supervisión y Control', color: '#f97316', bg: '#ffedd5' },
  { key: 'cerrado',               label: 'Cerrado',               color: '#22c55e', bg: '#dcfce7' },
]

const PRIORITY_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  urgent: { label: 'Urgente', bg: '#fee2e2', text: '#dc2626' },
  high:   { label: 'Alta',    bg: '#ffedd5', text: '#ea580c' },
  normal: { label: 'Media',   bg: '#dbeafe', text: '#2563eb' },
  low:    { label: 'Baja',    bg: '#dcfce7', text: '#16a34a' },
}

function inits(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function KanbanCard({ ticket, onClick }: { ticket: GDeskTicket; onClick: () => void }) {
  const category = ticket.folderName ?? ticket.listName
  const badge = PRIORITY_BADGE[ticket.priority]
  const dateStr = new Date(ticket.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short' })

  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group">
      {/* Category */}
      {category && (
        <p className="text-[11px] text-gray-400 font-medium mb-1">{category}</p>
      )}

      {/* Title */}
      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#1B3A6B] transition-colors mb-2">
        {ticket.title}
      </p>

      {/* Description */}
      {ticket.description && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
          {ticket.description}
        </p>
      )}

      {/* Assignees + Priority badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex -space-x-1">
          {ticket.assignedTo ? (
            <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center ring-2 ring-white flex-shrink-0" title={ticket.assignedTo}>
              <span className="text-[10px] font-bold text-white">{inits(ticket.assignedTo)}</span>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 ring-2 ring-white flex-shrink-0" title="Sin asignar" />
          )}
        </div>
        {badge && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Bottom stats */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {ticket.watchers?.length ?? 0}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          #{ticket.ticketNumber}
        </span>
        <span className="text-xs text-gray-300 ml-auto">{dateStr}</span>
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

  const total = tickets.length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {assignees.map((name, idx) => {
        const active = assignee === name
        const count = tickets.filter(t => t.assignedTo === name).length
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const color = ['#6366f1','#4194f0','#22c55e','#f97316','#e11d48','#a855f7'][idx % 6]
        const bg    = ['#ede9fe','#dbeafe','#dcfce7','#ffedd5','#ffe4e6','#f3e8ff'][idx % 6]
        return (
          <button
            key={name}
            onClick={() => toggle(name)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all card-shadow"
            style={{ backgroundColor: bg, outline: active ? `2px solid ${color}` : 'none', outlineOffset: '2px', minWidth: '170px' }}
          >
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: color }}
            >
              {inits(name)}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{name}</p>
              <p className="text-xs mt-0.5" style={{ color }}>{count} tickets · {pct}%</p>
            </div>
            {active && (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            )}
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
  const q           = searchParams.get('q')?.toLowerCase() ?? ''
  const month       = searchParams.get('month') ?? ''
  const assignee    = searchParams.get('assignee') ?? ''
  const statusFilter = searchParams.get('status') ?? ''

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
        (PRIORITY_BADGE[t.priority]?.label ?? '').toLowerCase().includes(q)
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

  const total = byMonth.length

  return (
    <div className="space-y-4">
      <AssigneeFilters tickets={byMonth} />

      <div className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-240px)]">
        {COLUMNS.map(col => {
          const items = grouped[col.key] ?? []
          const count = items.length
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const r = 20, circ = 2 * Math.PI * r, dash = circ * (pct / 100)
          return (
            <div key={col.key} className="flex-shrink-0 w-80 flex flex-col">
              {/* KPI como header de columna */}
              <div className="rounded-2xl card-shadow p-3 flex items-center gap-3 mb-4" style={{ backgroundColor: col.bg }}>
                <div className="relative flex-shrink-0 w-11 h-11 flex items-center justify-center">
                  <svg width="44" height="44" className="-rotate-90">
                    <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <circle cx="22" cy="22" r={r} fill="none" stroke={col.color} strokeWidth="5"
                      strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
                  </svg>
                  <span className="absolute text-[9px] font-bold" style={{ color: col.color }}>{pct}%</span>
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-800 leading-none">{count}</p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{col.label}</p>
                </div>
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
