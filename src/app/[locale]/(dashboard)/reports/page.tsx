'use client'

import { Suspense } from 'react'
import { useTickets } from '@/hooks/useTickets'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList, Cell,
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
        {/* Abiertos por agente */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-0.5">Tareas abiertas por agente</h2>
          <p className="text-xs text-gray-400 mb-4">Tickets en estado abierto o en progreso</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={openByAgent} margin={{ top: 16, right: 4, left: -20, bottom: 40 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tickets abiertos">
                {openByAgent.map((_, i) => <Cell key={i} fill={AGENT_COLORS[i % AGENT_COLORS.length]} />)}
                <LabelList dataKey="value" position="top" style={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Total por agente */}
        <div className="bg-white rounded-xl shadow-sm p-6">
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

      {/* Row 2 — por prioridad */}
      <div className="bg-white rounded-xl shadow-sm p-6">
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
