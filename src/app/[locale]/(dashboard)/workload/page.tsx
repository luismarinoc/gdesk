'use client'

import { Suspense, useMemo, useState } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight } from 'lucide-react'
import { MonthSelect } from '@/components/shared/MonthSelect'
import { useSearchParams } from 'next/navigation'
import type { GDeskTicket } from '@/types'

const STATUS_CONFIG: { key: GDeskTicket['status']; label: string; color: string }[] = [
  { key: 'backlog',               label: 'Backlog',               color: '#787486' },
  { key: 'listo_para_trabajar',   label: 'Listo para Trabajar',   color: '#e11d48' },
  { key: 'en_progreso',           label: 'En Progreso',           color: '#4194f0' },
  { key: 'supervision_y_control', label: 'Supervisión y Control', color: '#f97316' },
  { key: 'cerrado',               label: 'Cerrado',               color: '#22c55e' },
]

const DONE_STATUSES: GDeskTicket['status'][] = ['cerrado', 'resolved', 'closed']
const PENDING_STATUSES: GDeskTicket['status'][] = ['backlog', 'listo_para_trabajar', 'en_progreso', 'supervision_y_control', 'open', 'in_progress']

const AGENT_COLORS = ['#9ca3af', '#06b6d4', '#6366f1', '#c2a227', '#ec4899', '#f97316']

function inits(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface AgentStats {
  name: string
  pending: number
  done: number
  pct: number
  byStatus: { key: GDeskTicket['status']; label: string; color: string; count: number }[]
}

/* ── Donut ── */
function DonutPct({ pct }: { pct: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#22c55e" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
        {pct}%
      </span>
    </div>
  )
}

/* ── Agent Card ── */
function AgentCard({ agent, color }: { agent: AgentStats; color: string }) {
  const [open, setOpen] = useState(true)
  const total = agent.pending + agent.done

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
          {inits(agent.name)}
        </div>
        <span className="text-[13px] font-semibold text-gray-800 flex-1 truncate">{agent.name}</span>
        <button onClick={() => setOpen(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronRight className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div>
          <p className="text-xl font-bold text-gray-800">{agent.pending}</p>
          <p className="text-[10px] text-gray-400">Sin terminar</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800">{agent.done}</p>
          <p className="text-[10px] text-gray-400">Terminado</p>
        </div>
        <div className="ml-auto">
          <DonutPct pct={agent.pct} />
        </div>
      </div>

      {total > 0 && (
        <div className="flex h-1 rounded-full overflow-hidden mb-3">
          {agent.byStatus.map(s => s.count > 0 && (
            <div key={s.key} style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }} />
          ))}
        </div>
      )}

      {open && (
        <div className="space-y-1 mt-1">
          {agent.byStatus.filter(s => s.count > 0).map(s => (
            <div key={s.key} className="flex items-center gap-1.5 text-[11px]">
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-500 uppercase tracking-wide flex-1">{s.label}</span>
              <span className="font-semibold text-gray-600">({s.count})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Mini workload chart ── */
function WorkloadMiniChart({ stats, colors }: { stats: AgentStats[]; colors: string[] }) {
  const maxVal = Math.max(...stats.map(a => a.pending + a.done), 1)
  const chartH = 90
  const topPad = 14
  const barW = 7
  const gap = 3
  const avatarR = 14
  const n = stats.length
  const vbW = n * 52
  const vbH = chartH + topPad + avatarR * 2 + 8

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
      <p className="text-xs font-semibold text-gray-700 mb-2">Carga de trabajo</p>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} width="100%" height={vbH} preserveAspectRatio="xMidYMid meet">
        {stats.map((a, i) => {
          const total = a.pending + a.done
          const slotCx = i * 52 + 26
          const hTotal = total > 0 ? Math.max((total / maxVal) * chartH, 4) : 0
          const hDone  = a.done > 0  ? Math.max((a.done  / maxVal) * chartH, 4) : 0
          const x1 = slotCx - barW - gap / 2
          const x2 = slotCx + gap / 2
          const cy = topPad + chartH + avatarR + 6
          return (
            <g key={a.name}>
              <rect x={x1} y={topPad + chartH - hTotal} width={barW} height={hTotal} rx="2" fill="#d1d5db" />
              <rect x={x2} y={topPad + chartH - hDone}  width={barW} height={hDone}  rx="2" fill="#22c55e" />
              {total > 0 && (
                <text x={x1 + barW / 2} y={topPad + chartH - hTotal - 2} textAnchor="middle" fontSize="8" fill="#6b7280" fontWeight="600">
                  {total}
                </text>
              )}
              {a.done > 0 && (
                <text x={x2 + barW / 2} y={topPad + chartH - hDone - 2} textAnchor="middle" fontSize="8" fill="#22c55e" fontWeight="600">
                  {a.done}
                </text>
              )}
              <circle cx={slotCx} cy={cy} r={avatarR} fill={colors[i % colors.length]} />
              <text x={slotCx} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">
                {inits(a.name)}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-gray-300 inline-block" />Total</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-green-400 inline-block" />Terminado</span>
      </div>
    </div>
  )
}

/* ── Main ── */
function WorkloadContent() {
  const { tickets, loading } = useTickets()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? ''

  const filteredTickets = useMemo(() => {
    if (!month) return tickets
    return tickets.filter(t => {
      const d = new Date(t.createdAt)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return v === month
    })
  }, [tickets, month])

  const agentStats = useMemo<AgentStats[]>(() => {
    const map: Record<string, GDeskTicket[]> = {}
    filteredTickets.forEach(t => {
      const a = t.assignedTo ?? 'Sin asignar'
      if (!map[a]) map[a] = []
      map[a].push(t)
    })
    return Object.entries(map).map(([name, ts]) => {
      const pending = ts.filter(t => PENDING_STATUSES.includes(t.status)).length
      const done    = ts.filter(t => DONE_STATUSES.includes(t.status)).length
      const total   = ts.length
      const pct     = total > 0 ? Math.round((done / total) * 100) : 0
      const byStatus = STATUS_CONFIG.map(s => ({ ...s, count: ts.filter(t => t.status === s.key).length }))
      return { name, pending, done, pct, byStatus }
    }).sort((a, b) => (b.pending + b.done) - (a.pending + a.done))
  }, [filteredTickets])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <WorkloadMiniChart stats={agentStats} colors={AGENT_COLORS} />
      {agentStats.map((agent, i) => (
        <AgentCard key={agent.name} agent={agent} color={AGENT_COLORS[i % AGENT_COLORS.length]} />
      ))}
    </div>
  )
}

export default function WorkloadPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Carga de Trabajo</h1>
        <Suspense fallback={null}>
          <MonthSelect />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <WorkloadContent />
      </Suspense>
    </div>
  )
}
