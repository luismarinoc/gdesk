'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type UserProfile = {
  id: string
  full_name: string
  role: string
  clickup_list_id: string | null
  clickup_user_id: string | null
}

type ClickUpList = { id: string; name: string }
type ClickUpMember = { id: string; name: string; email: string }

export default function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [lists, setLists] = useState<ClickUpList[]>([])
  const [members, setMembers] = useState<ClickUpMember[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
      setUsers(usersData.users ?? [])
      setLists(listsData.lists ?? [])
      setMembers(membersData.members ?? [])
      setLoading(false)
    })
  }, [locale, router])

  async function handleListChange(userId: string, listId: string) {
    setSaving(userId)
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clickup_list_id: listId || null }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, clickup_list_id: listId || null } : u))
    setSaving(null)
  }

  async function handleMemberChange(userId: string, clickupUserId: string) {
    const member = members.find(m => m.id === clickupUserId) ?? null
    setSaving(userId + '_member')
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clickup_user_id: clickupUserId || null, clickup_user_name: member?.name ?? null }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, clickup_user_id: clickupUserId || null } : u))
    setSaving(null)
  }

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { admin: 'Admin', agent: 'Agente', client: 'Cliente' }
    return map[role] ?? role
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white border rounded-lg overflow-hidden">
          {[1, 2, 3].map(i => <div key={i} className="h-14 border-b bg-gray-50 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Lista ClickUp asignada</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Usuario ClickUp</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={async e => {
                      const newRole = e.target.value
                      setSaving(u.id + '_role')
                      const res = await fetch(`/api/users/${u.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: newRole }),
                      })
                      if (res.ok) {
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
                      } else {
                        const err = await res.json()
                        alert('Error: ' + (err.error ?? res.status))
                      }
                      setSaving(null)
                    }}
                    disabled={saving === u.id + '_role'}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-[#1B3A6B] transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agente</option>
                    <option value="client">Cliente</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.clickup_list_id ?? ''}
                      onChange={e => handleListChange(u.id, e.target.value)}
                      disabled={saving === u.id}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#1B3A6B] transition-colors"
                    >
                      <option value="">— Sin asignar —</option>
                      {lists.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    {saving === u.id && (
                      <svg className="animate-spin w-4 h-4 text-[#1B3A6B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.role !== 'client' ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={u.clickup_user_id ?? ''}
                        onChange={e => handleMemberChange(u.id, e.target.value)}
                        disabled={saving === u.id + '_member'}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#1B3A6B] transition-colors"
                      >
                        <option value="">— Sin asignar —</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      {saving === u.id + '_member' && (
                        <svg className="animate-spin w-4 h-4 text-[#1B3A6B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
