'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminListSelector } from '@/components/shared/AdminListSelector'
import { ADMIN_LIST_KEY } from '@/hooks/useTickets'

const USER_LIST_KEY = 'gdesk_user_list'

interface Props {
  isAdmin: boolean
  clickupListIds: string[]   // for non-admin users with multiple lists
  activeListId: string
  activeListName?: string
}

export function DashboardListSwitcher({ isAdmin, clickupListIds, activeListId, activeListName }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSelector, setShowSelector] = useState(false)
  const [userLists, setUserLists] = useState<{ id: string; name: string }[]>([])
  const [adminListName, setAdminListName] = useState(activeListName ?? '')

  // For admin: load saved list name from localStorage
  useEffect(() => {
    if (!isAdmin) return
    const saved = localStorage.getItem(ADMIN_LIST_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.id === activeListId) setAdminListName(parsed.name)
    }
    // If no URL list param yet, check localStorage and navigate
    if (!searchParams.get('list')) {
      const saved = localStorage.getItem(ADMIN_LIST_KEY)
      if (saved) {
        const { id, name } = JSON.parse(saved)
        const params = new URLSearchParams(searchParams.toString())
        params.set('list', id)
        params.set('listName', name)
        router.replace(`?${params.toString()}`)
      }
    }
  }, [isAdmin, activeListId, searchParams, router])

  // For non-admin: fetch list names
  useEffect(() => {
    if (isAdmin || clickupListIds.length < 2) return
    fetch('/api/clickup/lists')
      .then(r => r.json())
      .then(d => {
        const all: { id: string; name: string }[] = d.lists ?? []
        const mapped = clickupListIds
          .map(id => all.find(l => l.id === id) ?? { id, name: id })
        setUserLists(mapped)
        // If no URL list param, redirect to saved or first
        if (!searchParams.get('list')) {
          const saved = localStorage.getItem(USER_LIST_KEY)
          const savedParsed = saved ? JSON.parse(saved) : null
          const active = (savedParsed && clickupListIds.includes(savedParsed.id)) ? savedParsed : mapped[0]
          const params = new URLSearchParams(searchParams.toString())
          params.set('list', active.id)
          router.replace(`?${params.toString()}`)
        }
      })
  }, [isAdmin, clickupListIds, searchParams, router])

  function handleAdminSelect(id: string, name: string) {
    setAdminListName(name)
    setShowSelector(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('list', id)
    params.set('listName', name)
    router.push(`?${params.toString()}`)
  }

  function handleUserListSwitch(list: { id: string; name: string }) {
    localStorage.setItem(USER_LIST_KEY, JSON.stringify(list))
    const params = new URLSearchParams(searchParams.toString())
    params.set('list', list.id)
    router.push(`?${params.toString()}`)
  }

  if (isAdmin) {
    return (
      <>
        {showSelector && <AdminListSelector onSelect={handleAdminSelect} />}
        {adminListName && (
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[#1B3A6B]/20 text-[#1B3A6B] hover:bg-blue-50 transition-colors"
          >
            <span>{adminListName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}
      </>
    )
  }

  if (userLists.length > 1) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {userLists.map(l => (
          <button
            key={l.id}
            onClick={() => handleUserListSwitch(l)}
            className="text-xs px-2.5 py-1 rounded-full border transition-colors"
            style={l.id === activeListId
              ? { backgroundColor: '#1B3A6B', color: '#fff', borderColor: '#1B3A6B' }
              : { backgroundColor: 'transparent', color: '#1B3A6B', borderColor: 'rgba(27,58,107,0.2)' }
            }
          >
            {l.name}
          </button>
        ))}
      </div>
    )
  }

  return null
}
