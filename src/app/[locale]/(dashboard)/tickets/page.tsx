'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { MonthSelect } from '@/components/shared/MonthSelect'
import { AdminListSelector } from '@/components/shared/AdminListSelector'
import { useTickets, ADMIN_LIST_KEY } from '@/hooks/useTickets'
import type { GDeskTicket } from '@/types'

const USER_LIST_KEY = 'gdesk_user_list'

function inits(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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

  const total = tickets.length

  function toggle(name: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (assignee === name) params.delete('assignee')
    else params.set('assignee', name)
    router.push(`?${params.toString()}`)
  }

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

const STATUS_OPTIONS = [
  { key: 'backlog',               label: 'Backlog',          color: '#787486', bg: '#f3f4f6' },
  { key: 'listo_para_trabajar',   label: 'Listo p/T.',       color: '#e11d48', bg: '#ffe4e6' },
  { key: 'en_progreso',           label: 'En Progreso',      color: '#4194f0', bg: '#dbeafe' },
  { key: 'supervision_y_control', label: 'Supervisión',      color: '#f97316', bg: '#ffedd5' },
  { key: 'cerrado',               label: 'Cerrado',          color: '#22c55e', bg: '#dcfce7' },
]

function StatusFilters({ tickets }: { tickets: GDeskTicket[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeStatus = searchParams.get('status') ?? ''

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (activeStatus === key) params.delete('status')
    else params.set('status', key)
    router.push(`?${params.toString()}`)
  }

  const total = tickets.length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {STATUS_OPTIONS.map(({ key, label, color, bg }) => {
        const count = tickets.filter(t => t.status === key).length
        if (count === 0) return null
        const active = activeStatus === key
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all card-shadow"
            style={{ backgroundColor: bg, outline: active ? `2px solid ${color}` : 'none', outlineOffset: '2px', minWidth: '170px' }}
          >
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{label}</p>
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

function TicketsPageInner() {
  const t = useTranslations('tickets')
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const month = searchParams.get('month') ?? 'all'

  const [isAdmin, setIsAdmin] = useState(false)
  const [isAgent, setIsAgent] = useState(false)
  const [adminList, setAdminList] = useState<{ id: string; name: string } | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [userActiveList, setUserActiveList] = useState<{ id: string; name: string } | null>(null)
  const [userLists, setUserLists] = useState<{ id: string; name: string }[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/clickup/lists').then(r => r.json()),
    ]).then(([meData, listsData]) => {
      const role = meData.user?.role
      const allLists: { id: string; name: string }[] = listsData.lists ?? []
      if (role === 'agent') setIsAgent(true)
      if (role === 'admin') {
        setIsAdmin(true)
        const saved = localStorage.getItem(ADMIN_LIST_KEY)
        if (saved) {
          setAdminList(JSON.parse(saved))
        } else if (meData.user?.clickupListId) {
          const defaultList = { id: meData.user.clickupListId, name: 'Mi lista' }
          localStorage.setItem(ADMIN_LIST_KEY, JSON.stringify(defaultList))
          setAdminList(defaultList)
        } else {
          setShowSelector(true)
        }
      } else {
        // Non-admin: check if user has multiple assigned lists
        const assignedIds: string[] = meData.user?.clickupListIds ?? []
        if (assignedIds.length > 1) {
          const mapped = assignedIds
            .map(id => allLists.find(l => l.id === id) ?? { id, name: id })
          setUserLists(mapped)
          const saved = localStorage.getItem(USER_LIST_KEY)
          const savedParsed = saved ? JSON.parse(saved) : null
          const active = (savedParsed && assignedIds.includes(savedParsed.id))
            ? savedParsed
            : mapped[0]
          setUserActiveList(active)
          localStorage.setItem(USER_LIST_KEY, JSON.stringify(active))
        }
      }
      setReady(true)
    })
  }, [])

  function handleUserListSwitch(list: { id: string; name: string }) {
    setUserActiveList(list)
    localStorage.setItem(USER_LIST_KEY, JSON.stringify(list))
  }

  const activeListId = isAdmin ? adminList?.id : (userActiveList?.id ?? undefined)
  const { tickets, loading, error } = useTickets(activeListId)

  // Tickets filtered only by month (for assignee button list — same pattern as Kanban)
  const byMonth = useMemo(() => {
    if (month === 'all') return tickets
    return tickets.filter(t => {
      const d = new Date(t.createdAt)
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return v === month
    })
  }, [tickets, month])

  function handleListSelect(id: string, name: string) {
    setAdminList({ id, name })
    setShowSelector(false)
  }

  return (
    <>
      {showSelector && <AdminListSelector onSelect={handleListSelect} />}

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            {isAdmin && adminList && (
              <button
                onClick={() => setShowSelector(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[#1B3A6B]/20 text-[#1B3A6B] hover:bg-blue-50 transition-colors"
              >
                <span>{adminList.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            )}
            {!isAdmin && userLists.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {userLists.map(l => (
                  <button
                    key={l.id}
                    onClick={() => handleUserListSwitch(l)}
                    className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                    style={userActiveList?.id === l.id
                      ? { backgroundColor: '#1B3A6B', color: '#fff', borderColor: '#1B3A6B' }
                      : { backgroundColor: 'transparent', color: '#1B3A6B', borderColor: 'rgba(27,58,107,0.2)' }
                    }
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <MonthSelect value={month} />
            {!isAgent && (
              <Link href={`/${locale}/tickets/new`}>
                <Button>{t('new')}</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap flex-shrink-0">
          <AssigneeFilters tickets={ready ? byMonth : []} />
          <StatusFilters tickets={ready ? byMonth : []} />
        </div>

        {error === 'NO_LIST_ASSIGNED' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 21.5 18z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta no configurada</h2>
              <p className="text-sm text-gray-500 mb-6">Comunícate con soporte de GPartner para que te asignen acceso a tus tickets.</p>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.href = `/${locale}/login`
                }}
                className="w-full py-2.5 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#152d54] transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
        {error && error !== 'NO_LIST_ASSIGNED' && <p className="text-red-500 flex-shrink-0">{error}</p>}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TicketsTable tickets={ready ? tickets : []} loading={!ready || loading} monthFilter={month} />
        </div>
      </div>
    </>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsPageInner />
    </Suspense>
  )
}
