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

/* ── Distribution Bars ────────────────────────────────────────── */
interface DonutProps {
  data: { name: string; value: number; color?: string }[]
}

export function SatisfactionDonut({ data }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
        Sin datos aún
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4 pt-2">
      {data.map((d) => {
        const pct = Math.round((d.value / total) * 100)
        const color = d.color ?? STATUS_COLORS[d.name] ?? '#9ca3af'
        return (
          <div key={d.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">{d.name}</span>
              <span className="text-sm font-bold ml-3 flex-shrink-0" style={{ color }}>{pct}%</span>
            </div>
            <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 4, left: -24, bottom: 0 }} barSize={25} barCategoryGap="20%" barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 13, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
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
