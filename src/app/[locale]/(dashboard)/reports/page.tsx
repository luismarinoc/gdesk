'use client'

import { Suspense } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
  AreaChart, Area,
  PieChart, Pie,
} from 'recharts'

const AGENT_COLORS = ['#1B3A6B', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e']

function ReportsContent() {
  const { tickets, loading } = useTickets()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Tickets abiertos por agente (pendientes = no cerrados)
  const openTickets = tickets.filter(t => t.status !== 'cerrado' && t.status !== 'closed' && t.status !== 'resolved')
  const agentOpenMap: Record<string, number> = {}
  openTickets.forEach(t => {
    const a = t.assignedTo ?? 'Sin asignar'
    agentOpenMap[a] = (agentOpenMap[a] ?? 0) + 1
  })
  const openByAgent = Object.entries(agentOpenMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Todos los tickets por agente
  const agentTotalMap: Record<string, number> = {}
  tickets.forEach(t => {
    const a = t.assignedTo ?? 'Sin asignar'
    agentTotalMap[a] = (agentTotalMap[a] ?? 0) + 1
  })
  const totalByAgent = Object.entries(agentTotalMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Actividad mensual — últimos 6 meses
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es', { month: 'short' })
    const inMonth = tickets.filter(t => {
      const td = new Date(t.createdAt)
      return `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}` === key
    })
    return {
      month: label.charAt(0).toUpperCase() + label.slice(1),
      creados: inMonth.length,
      cerrados: inMonth.filter(t => t.status === 'cerrado' || t.status === 'closed' || t.status === 'resolved').length,
      enProgreso: inMonth.filter(t => t.status === 'en_progreso' || t.status === 'in_progress').length,
    }
  })

  // Tickets por prioridad
  const priorityMap: Record<string, number> = {}
  tickets.forEach(t => { priorityMap[t.priority] = (priorityMap[t.priority] ?? 0) + 1 })
  const byPriority = [
    { name: 'Urgente', value: priorityMap['urgent'] ?? 0, color: '#ef4444' },
    { name: 'Alta',    value: priorityMap['high']   ?? 0, color: '#f97316' },
    { name: 'Normal',  value: priorityMap['normal'] ?? 0, color: '#3b82f6' },
    { name: 'Baja',    value: priorityMap['low']    ?? 0, color: '#9ca3af' },
  ]

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Abiertos por agente — gauge semicircular */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-0.5">Tareas abiertas por agente</h2>
          <p className="text-xs text-gray-400 mb-2">Tickets en estado abierto o en progreso</p>
          <div className="relative" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={openByAgent.length > 0 ? openByAgent : [{ name: 'Sin tickets', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={90}
                  outerRadius={160}
                  isAnimationActive={false}
                  paddingAngle={2}
                >
                  {(openByAgent.length > 0 ? openByAgent : [{ name: 'Sin tickets', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Total centrado en el hueco del semicírculo */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-2">
              <span className="text-3xl font-bold text-gray-800">{openByAgent.reduce((s, a) => s + a.value, 0)}</span>
              <span className="text-xs text-gray-400">Total abiertos</span>
            </div>
          </div>
          {/* Leyenda */}
          <div className="mt-1 space-y-1.5">
            {openByAgent.map((a, i) => {
              const total = openByAgent.reduce((s, x) => s + x.value, 0)
              const pct = total > 0 ? Math.round((a.value / total) * 100) : 0
              return (
                <div key={a.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: AGENT_COLORS[i % AGENT_COLORS.length] }} />
                  <span className="flex-1 text-gray-600 truncate">{a.name}</span>
                  <span className="font-semibold text-gray-700">{pct}%</span>
                  <span className="text-gray-400 w-6 text-right">{a.value}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Total por agente */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-0.5">Total de tickets por agente</h2>
          <p className="text-xs text-gray-400 mb-4">Todos los tickets asignados (últimos 6 meses)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={totalByAgent} margin={{ top: 16, right: 4, left: -20, bottom: 40 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Total tickets">
                {totalByAgent.map((_, i) => <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />)}
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 — actividad mensual área */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-0.5">Actividad mensual de tickets</h2>
        <p className="text-xs text-gray-400 mb-4">Creados, cerrados y en progreso — últimos 6 meses</p>
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#6366f1' }} />Creados</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#22c55e' }} />Cerrados</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f97316' }} />En Progreso</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCreados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradCerrados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradProgreso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="creados"    name="Creados"     stroke="#6366f1" strokeWidth={2.5} fill="url(#gradCreados)"  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="cerrados"   name="Cerrados"    stroke="#22c55e" strokeWidth={2.5} fill="url(#gradCerrados)" dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="enProgreso" name="En Progreso" stroke="#f97316" strokeWidth={2.5} fill="url(#gradProgreso)" dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3 — por prioridad */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-0.5">Tickets por prioridad</h2>
        <p className="text-xs text-gray-400 mb-4">Distribución de tickets según nivel de prioridad</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byPriority} margin={{ top: 16, right: 4, left: -20, bottom: 0 }} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tickets">
              {byPriority.map((d, i) => <Cell key={i} fill={d.color} />)}
              <LabelList dataKey="value" position="top" style={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
      <Suspense fallback={null}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}
