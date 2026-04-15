'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts'

/* ── Color palette (shared across all charts) ─────────────────── */
export const STATUS_COLORS: Record<string, string> = {
  // Donut labels
  'Pendientes':  '#f97316',
  'Cerrados':    '#22c55e',
  // Bar chart keys
  creados:     '#6366f1',
  backlog:     '#787486',
  listo:       '#e11d48',
  enProgreso:  '#4194f0',
  supervision: '#f97316',
  cerrados:    '#22c55e',
}

/* ── Sparkline ────────────────────────────────────────────────── */
interface SparklineProps {
  color: string
  data?: { v: number }[]
}

const DEFAULT_SPARK = [
  { v: 4 }, { v: 7 }, { v: 5 }, { v: 9 }, { v: 6 }, { v: 11 },
  { v: 8 }, { v: 13 }, { v: 10 }, { v: 15 }, { v: 12 }, { v: 14 },
]

export function Sparkline({ color, data = DEFAULT_SPARK }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sg-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── Donut Chart ──────────────────────────────────────────────── */
interface DonutProps {
  data: { name: string; value: number; color?: string }[]
}

export function SatisfactionDonut({ data }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Sin datos aún
      </div>
    )
  }
  return (
    <div className="flex items-center w-full gap-4">
      <div className="flex-1 min-w-0" style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="75%"
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color ?? STATUS_COLORS[d.name] ?? '#9ca3af'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${Math.round((Number(v) / total) * 100)}%`, '']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 text-sm flex-shrink-0">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color ?? STATUS_COLORS[d.name] ?? '#9ca3af' }} />
            <span className="text-xs text-gray-600">{d.name}</span>
            <span className="ml-auto text-xs font-semibold text-gray-800 pl-2">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Bar Chart ────────────────────────────────────────────────── */
interface BarProps {
  data: { month: string; creados: number; backlog: number; listo: number; enProgreso: number; supervision: number; cerrados: number }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const label = (key: string) => (
  <LabelList dataKey={key} position="top" style={{ fontSize: 9, fill: '#6b7280' }} formatter={(v: any) => v > 0 ? v : ''} />
)

export function TicketsBarChart({ data }: BarProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 14, right: 4, left: -24, bottom: 0 }} barSize={10} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Bar dataKey="creados"    fill="#6366f1" radius={[4,4,0,0]} name="Creados">{label('creados')}</Bar>
        <Bar dataKey="backlog"    fill="#787486" radius={[4,4,0,0]} name="Backlog">{label('backlog')}</Bar>
        <Bar dataKey="listo"      fill="#e11d48" radius={[4,4,0,0]} name="Listo para Trabajar">{label('listo')}</Bar>
        <Bar dataKey="enProgreso" fill="#4194f0" radius={[4,4,0,0]} name="En Progreso">{label('enProgreso')}</Bar>
        <Bar dataKey="supervision"fill="#f97316" radius={[4,4,0,0]} name="Supervisión y Control">{label('supervision')}</Bar>
        <Bar dataKey="cerrados"   fill="#22c55e" radius={[4,4,0,0]} name="Cerrados">{label('cerrados')}</Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
