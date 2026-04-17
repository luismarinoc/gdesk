'use client'

import { use, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const MODULES = [
  { key: 'dashboard',       label: 'Dashboard' },
  { key: 'kanban',          label: 'Kanban' },
  { key: 'reports',         label: 'Reportes' },
  { key: 'workload',        label: 'Carga de Trabajo' },
  { key: 'tickets',         label: 'Gestión de Tickets' },
  { key: 'own_tickets_only', label: 'Solo sus tickets' },
]

const ROLES = [
  { key: 'admin',  label: 'Admin',   color: '#6366f1', bg: '#ede9fe' },
  { key: 'agent',  label: 'Agente',  color: '#4194f0', bg: '#dbeafe' },
  { key: 'client', label: 'Cliente', color: '#22c55e', bg: '#dcfce7' },
]

type UserProfile = {
  id: string
  full_name: string
  role: string
  clickup_list_id: string | null
  clickup_list_ids: string[]
  clickup_user_id: string | null
  permissions: string[]
}

type ClickUpList   = { id: string; name: string }
type ClickUpMember = { id: string; name: string; email: string }

function inits(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-[#1B3A6B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

export default function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router     = useRouter()

  const [users,   setUsers]   = useState<UserProfile[]>([])
  const [lists,   setLists]   = useState<ClickUpList[]>([])
  const [members, setMembers] = useState<ClickUpMember[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [saving,   setSaving]   = useState<Record<string, boolean>>({})
  const [listSearch, setListSearch] = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/clickup/lists').then(r => r.json()),
      fetch('/api/clickup/members').then(r => r.json()),
    ]).then(([me, usersData, listsData, membersData]) => {
      if (me.user?.role !== 'admin') {
        router.push(`/${locale}/tickets`)
        return
      }
      const parsed = (usersData.users ?? []).map((u: UserProfile) => ({
        ...u,
        permissions:     u.permissions     ?? [],
        clickup_list_ids: u.clickup_list_ids ?? [],
      }))
      setUsers(parsed)
      setLists(listsData.lists ?? [])
      setMembers(membersData.members ?? [])
      if (parsed.length > 0) setSelected(parsed[0].id)
      setLoading(false)
    })
  }, [locale, router])

  async function patch(userId: string, key: string, body: object) {
    setSaving(s => ({ ...s, [userId + key]: true }))
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(s => ({ ...s, [userId + key]: false }))
  }

  async function handleRole(userId: string, role: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    await patch(userId, 'role', { role })
  }

  async function handleMember(userId: string, clickupUserId: string) {
    const member = members.find(m => m.id === clickupUserId) ?? null
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, clickup_user_id: clickupUserId || null } : u))
    await patch(userId, 'member', { clickup_user_id: clickupUserId || null, clickup_user_name: member?.name ?? null })
  }

  async function handleListToggle(userId: string, listId: string, checked: boolean) {
    const user = users.find(u => u.id === userId)
    if (!user) return
    const newIds = checked
      ? [...new Set([...user.clickup_list_ids, listId])]
      : user.clickup_list_ids.filter(id => id !== listId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, clickup_list_ids: newIds, clickup_list_id: newIds[0] ?? null } : u))
    await patch(userId, 'lists', { clickup_list_ids: newIds })
  }

  async function handlePermission(userId: string, module: string, checked: boolean) {
    const user = users.find(u => u.id === userId)
    if (!user) return
    const newPerms = checked
      ? [...new Set([...user.permissions, module])]
      : user.permissions.filter(p => p !== module)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: newPerms } : u))
    await patch(userId, 'perms', { permissions: newPerms })
  }

  const user = useMemo(() => users.find(u => u.id === selected) ?? null, [users, selected])
  const filteredLists = useMemo(() =>
    listSearch.trim()
      ? lists.filter(l => l.name.toLowerCase().includes(listSearch.toLowerCase()))
      : lists,
    [lists, listSearch]
  )

  if (loading) {
    return (
      <div className="flex gap-4 h-[calc(100vh-140px)]">
        <div className="w-64 bg-white rounded-2xl card-shadow animate-pulse" />
        <div className="flex-1 bg-white rounded-2xl card-shadow animate-pulse" />
      </div>
    )
  }

  const roleInfo = ROLES.find(r => r.key === user?.role)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>

      <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: 'calc(100vh - 180px)' }}>

        {/* ── Left: user list ── */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl card-shadow overflow-hidden flex flex-col max-h-72 md:max-h-none">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{users.length} usuarios</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.map(u => {
              const ri = ROLES.find(r => r.key === u.role)
              const active = selected === u.id
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                  style={active ? { backgroundColor: '#f0f4ff', borderLeft: '3px solid #1B3A6B' } : { borderLeft: '3px solid transparent' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: ri?.color ?? '#9ca3af' }}
                  >
                    {inits(u.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{u.full_name}</p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: ri?.bg ?? '#f3f4f6', color: ri?.color ?? '#6b7280' }}
                    >
                      {ri?.label ?? u.role}
                    </span>
                  </div>
                  {Object.values(saving).some(Boolean) && active && (
                    <Spinner />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right: user detail ── */}
        {user ? (
          <div className="flex-1 bg-white rounded-2xl card-shadow overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: roleInfo?.color ?? '#9ca3af' }}
              >
                {inits(user.full_name)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user.full_name}</h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: roleInfo?.bg ?? '#f3f4f6', color: roleInfo?.color ?? '#6b7280' }}
                >
                  {roleInfo?.label ?? user.role}
                </span>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Rol */}
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tipo de rol</p>
                <div className="flex gap-2 flex-wrap">
                  {ROLES.map(r => {
                    const active = user.role === r.key
                    return (
                      <button
                        key={r.key}
                        onClick={() => handleRole(user.id, r.key)}
                        disabled={!!saving[user.id + 'role']}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                        style={active
                          ? { backgroundColor: r.color, color: '#fff', borderColor: r.color }
                          : { backgroundColor: r.bg, color: r.color, borderColor: 'transparent' }
                        }
                      >
                        {saving[user.id + 'role'] && active ? <Spinner /> : null}
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Usuario ClickUp */}
              {user.role !== 'client' && (
                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Usuario ClickUp</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.clickup_user_id ?? ''}
                      onChange={e => handleMember(user.id, e.target.value)}
                      disabled={!!saving[user.id + 'member']}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#1B3A6B] transition-colors w-72"
                    >
                      <option value="">— Sin asignar —</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {saving[user.id + 'member'] && <Spinner />}
                  </div>
                </section>
              )}

              {/* Proyectos */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Proyectos asignados
                    {user.clickup_list_ids.length > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#1B3A6B' }}>
                        {user.clickup_list_ids.length}
                      </span>
                    )}
                  </p>
                  {saving[user.id + 'lists'] && <Spinner />}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    value={listSearch}
                    onChange={e => setListSearch(e.target.value)}
                    placeholder="Buscar proyecto..."
                    className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {filteredLists.map(l => {
                    const checked = user.clickup_list_ids.includes(l.id)
                    return (
                      <label
                        key={l.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border"
                        style={checked
                          ? { backgroundColor: '#f0f4ff', borderColor: '#1B3A6B33' }
                          : { backgroundColor: '#fafafa', borderColor: '#e5e7eb' }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => handleListToggle(user.id, l.id, e.target.checked)}
                          className="w-4 h-4 accent-[#1B3A6B] flex-shrink-0"
                        />
                        <span className="text-sm text-gray-700 truncate">{l.name}</span>
                        {checked && (
                          <svg className="w-3.5 h-3.5 text-[#1B3A6B] flex-shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </label>
                    )
                  })}
                  {filteredLists.length === 0 && (
                    <p className="text-xs text-gray-400 py-2 col-span-2">Sin resultados</p>
                  )}
                </div>
              </section>

              {/* Accesos */}
              {user.role !== 'admin' && (
                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accesos al sistema</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MODULES.map(m => {
                      const checked = user.permissions.includes(m.key)
                      const isLock  = m.key === 'own_tickets_only'
                      return (
                        <label
                          key={m.key}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border"
                          style={checked
                            ? { backgroundColor: isLock ? '#fff7ed' : '#f0f4ff', borderColor: isLock ? '#f9731633' : '#1B3A6B33' }
                            : { backgroundColor: '#fafafa', borderColor: '#e5e7eb' }
                          }
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => handlePermission(user.id, m.key, e.target.checked)}
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ accentColor: isLock ? '#f97316' : '#1B3A6B' }}
                          />
                          <span className="text-xs text-gray-700">{m.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )}

              {user.role === 'admin' && (
                <section>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Accesos al sistema</p>
                  <p className="text-sm text-gray-400">Acceso total a todos los módulos</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl card-shadow flex items-center justify-center text-gray-300 text-sm">
            Selecciona un usuario
          </div>
        )}
      </div>
    </div>
  )
}
