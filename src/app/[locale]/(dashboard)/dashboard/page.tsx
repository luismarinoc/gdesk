import { Suspense } from 'react'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { listTickets } from '@/services/clickup-ticket.service'

function getCachedTickets(listId: string) {
  return unstable_cache(
    () => listTickets(listId),
    [`clickup-tickets-${listId}`],
    { revalidate: 300, tags: ['clickup-tickets', `clickup-tickets-${listId}`] }
  )()
}
import type { GDeskTicket } from '@/types'
import { SatisfactionDonut, TicketsBarChart } from '@/components/dashboard/DashboardCharts'
import { MonthSelect } from '@/components/shared/MonthSelect'

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { locale } = await params
  const { month } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role, clickup_list_id, clickup_user_name, permissions')
    .eq('id', user!.id)
    .single()

  const firstName = (profile?.full_name ?? user?.email ?? '').split(' ')[0]
  const listId = profile?.clickup_list_id ?? process.env.CLICKUP_LIST_ID!
  const permissions: string[] = profile?.permissions ?? []
  const ownOnly = profile?.role !== 'admin' && permissions.includes('own_tickets_only') && !!profile?.clickup_user_name

  let allTickets: GDeskTicket[] = []
  try {
    const fetched = await getCachedTickets(listId)
    allTickets = ownOnly
      ? fetched.filter(t => t.assignedTo === profile!.clickup_user_name)
      : fetched
  } catch {
    // silently fail
  }

  // Filter by month if selected
  const tickets = month
    ? allTickets.filter(t => {
        const d = new Date(t.createdAt)
        const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return v === month
      })
    : allTickets

  const PENDING_STATUSES = ['backlog', 'listo_para_trabajar', 'en_progreso', 'supervision_y_control', 'open', 'in_progress'] as const
  const DONE_STATUSES = ['cerrado', 'resolved', 'closed'] as const

  const total = tickets.length
  const open = tickets.filter((t) => PENDING_STATUSES.includes(t.status as typeof PENDING_STATUSES[number])).length
  const inProgress = 0 // merged into open/pending
  const resolved = 0   // merged into done
  const closed = tickets.filter((t) => DONE_STATUSES.includes(t.status as typeof DONE_STATUSES[number])).length

  const recent = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Bar chart: 6 months (always from allTickets for context)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { month: d.toLocaleString('es', { month: 'short' }), year: d.getFullYear(), monthNum: d.getMonth() }
  })
  const barData = months.map(({ month: m, year, monthNum }) => {
    const mt = allTickets.filter(t => {
      const d = new Date(t.createdAt)
      return d.getFullYear() === year && d.getMonth() === monthNum
    })
    return {
      month: m,
      creados:    mt.length,
      backlog:    mt.filter(t => t.status === 'backlog').length,
      listo:      mt.filter(t => t.status === 'listo_para_trabajar').length,
      enProgreso: mt.filter(t => t.status === 'en_progreso').length,
      supervision:mt.filter(t => t.status === 'supervision_y_control').length,
      cerrados:   mt.filter(t => t.status === 'cerrado').length,
    }
  })

  const agentMap: Record<string, { total: number; backlog: number; listo: number; enProgreso: number; supervision: number; cerrado: number }> = {}
  tickets.forEach(t => {
    const a = t.assignedTo ?? 'Sin asignar'
    if (!agentMap[a]) agentMap[a] = { total: 0, backlog: 0, listo: 0, enProgreso: 0, supervision: 0, cerrado: 0 }
    agentMap[a].total++
    if (t.status === 'backlog')               agentMap[a].backlog++
    if (t.status === 'listo_para_trabajar')   agentMap[a].listo++
    if (t.status === 'en_progreso')           agentMap[a].enProgreso++
    if (t.status === 'supervision_y_control') agentMap[a].supervision++
    if (t.status === 'cerrado' || t.status === 'resolved' || t.status === 'closed') agentMap[a].cerrado++
  })
  const topAgents = Object.entries(agentMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, stats]) => ({ name, ...stats }))

  const statusBadge: Record<string, string> = {
    backlog:               'bg-gray-100 text-gray-600',
    listo_para_trabajar:   'bg-red-100 text-red-700',
    en_progreso:           'bg-blue-100 text-blue-700',
    supervision_y_control: 'bg-orange-100 text-orange-700',
    cerrado:               'bg-green-100 text-green-700',
    open:        'bg-orange-100 text-orange-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved:    'bg-green-100 text-green-700',
    closed:      'bg-gray-100 text-gray-500',
  }
  const statusLabel: Record<string, string> = {
    backlog:               'Backlog',
    listo_para_trabajar:   'Listo para Trabajar',
    en_progreso:           'En Progreso',
    supervision_y_control: 'Supervisión y Control',
    cerrado:               'Cerrado',
    open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado',
  }

  const backlogCount    = tickets.filter(t => t.status === 'backlog').length
  const listoCount      = tickets.filter(t => t.status === 'listo_para_trabajar').length
  const enProgresoCount = tickets.filter(t => t.status === 'en_progreso').length
  const supervisionCount= tickets.filter(t => t.status === 'supervision_y_control').length
  const cerradoCount    = tickets.filter(t => t.status === 'cerrado').length

  const donutData = [
    { name: 'Backlog',               value: backlogCount,     color: '#787486' },
    { name: 'Listo para Trabajar',   value: listoCount,       color: '#e11d48' },
    { name: 'En Progreso',           value: enProgresoCount,  color: '#4194f0' },
    { name: 'Supervisión y Control', value: supervisionCount, color: '#f97316' },
    { name: 'Cerrado',               value: cerradoCount,     color: '#22c55e' },
  ].filter(d => d.value > 0)

  const kpiCards = [
    { label: 'Total',                  sublabel: 'Todos los tickets',   value: total,            color: '#6366f1', textColor: 'text-indigo-700', bg: '#ede9fe' },
    { label: 'Backlog',                sublabel: 'Sin iniciar',         value: backlogCount,      color: '#787486', textColor: 'text-gray-600',   bg: '#f3f4f6' },
    { label: 'Listo para Trabajar',    sublabel: 'Listos para asignar', value: listoCount,        color: '#e11d48', textColor: 'text-rose-700',   bg: '#ffe4e6' },
    { label: 'En Progreso',            sublabel: 'Siendo atendidos',    value: enProgresoCount,   color: '#4194f0', textColor: 'text-blue-700',   bg: '#dbeafe' },
    { label: 'Supervisión y Control',  sublabel: 'En revisión',         value: supervisionCount,  color: '#f97316', textColor: 'text-orange-700', bg: '#ffedd5' },
    { label: 'Cerrado',                sublabel: 'Finalizados',         value: cerradoCount,      color: '#22c55e', textColor: 'text-green-700',  bg: '#dcfce7' },
  ]

  const selectedMonthLabel = month
    ? new Date(month + '-02').toLocaleString('es', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      {/* Welcome + month selector */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido, {firstName}!</h1>
          <p className="text-sm text-gray-500 mt-1">
            Panel de monitoreo de soporte — GPartner Consulting
            {selectedMonthLabel && (
              <span className="ml-2 text-[#1B3A6B] font-medium capitalize">· {selectedMonthLabel}</span>
            )}
          </p>
        </div>
        <Suspense fallback={null}>
          <MonthSelect value={month ?? 'all'} />
        </Suspense>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map(({ label, sublabel, value, color, bg }) => {
          const pct = total > 0 ? Math.round((value / total) * 100) : (label === 'Total' ? 100 : 0)
          const r = 22
          const circ = 2 * Math.PI * r
          const dash = circ * (pct / 100)
          return (
          <div key={label} className="rounded-2xl card-shadow p-4 flex items-center gap-3" style={{ backgroundColor: bg }}>
            {/* Ring */}
            <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="28" cy="28" r={r} fill="none"
                  stroke={color} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circ}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </div>
            </div>
            {/* Text */}
            <div className="min-w-0">
              <p className="text-3xl font-bold text-gray-800 leading-none">{value}</p>
              <p className="text-[13px] text-gray-500 mt-1 truncate">{label}</p>
            </div>
          </div>
          )
        })}
      </div>

      {/* Donut + Agent table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl card-shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-700">Distribución de Tickets</h2>
            <Link href={`/${locale}/tickets`} className="text-xs text-[#1B3A6B] hover:underline">Ver más</Link>
          </div>
          <SatisfactionDonut data={donutData.length > 0 ? donutData : [{ name: 'Sin tickets', value: 1 }]} />
        </div>

        <div className="bg-white rounded-xl card-shadow p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Tickets por Agente</h2>
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {topAgents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin tickets asignados</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-gray-400 uppercase tracking-wider border-b">
                    <th className="text-left pb-1.5">Agente</th>
                    <th className="text-right pb-1.5">Total</th>
                    <th className="text-right pb-1.5" style={{ color: '#787486' }}>BL</th>
                    <th className="text-right pb-1.5" style={{ color: '#e11d48' }}>LT</th>
                    <th className="text-right pb-1.5" style={{ color: '#4194f0' }}>EP</th>
                    <th className="text-right pb-1.5" style={{ color: '#f97316' }}>SV</th>
                    <th className="text-right pb-1.5" style={{ color: '#22c55e' }}>CR</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((a, i) => (
                    <tr key={a.name} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                      <td className="py-1.5 text-gray-700 font-medium truncate max-w-[120px]">{a.name}</td>
                      <td className="py-1.5 text-right text-gray-700 font-semibold">{a.total}</td>
                      <td className="py-1.5 text-right text-gray-500">{a.backlog}</td>
                      <td className="py-1.5 text-right text-gray-500">{a.listo}</td>
                      <td className="py-1.5 text-right text-gray-500">{a.enProgreso}</td>
                      <td className="py-1.5 text-right text-gray-500">{a.supervision}</td>
                      <td className="py-1.5 text-right font-semibold" style={{ color: '#22c55e' }}>{a.cerrado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">BL=Backlog · LT=Listo p/Trabajar · EP=En Progreso · SV=Supervisión · CR=Cerrado</p>
        </div>
      </div>

      {/* Recent tickets + bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl card-shadow p-4" style={{ height: '320px' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">Tickets Recientes</h2>
            <Link href={`/${locale}/tickets`} className="text-xs text-[#1B3A6B] font-medium hover:underline">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin tickets en este período</p>
          ) : (
            <div className="overflow-y-auto space-y-1" style={{ maxHeight: 240 }}>
              {recent.map((ticket, i) => (
                <Link
                  key={ticket.id}
                  href={`/${locale}/tickets/${ticket.id}`}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-5 h-5 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-[#1B3A6B]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate group-hover:text-[#1B3A6B]">{ticket.title}</p>
                    <p className="text-[10px] text-gray-400">#{ticket.ticketNumber}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {statusLabel[ticket.status] ?? ticket.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl card-shadow p-4" style={{ height: '320px' }}>
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-gray-700">Comparación de Tickets</h2>
            <p className="text-xs text-gray-400 mb-2">Distribución por estado — últimos 6 meses</p>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:'#6366f1'}} />Creados</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:'#787486'}} />Backlog</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:'#e11d48'}} />Listo p/Trabajar</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:'#4194f0'}} />En Progreso</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:'#f97316'}} />Supervisión</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{background:'#22c55e'}} />Cerrados</span>
            </div>
          </div>
          <TicketsBarChart data={barData} />
        </div>
      </div>
    </div>
  )
}
