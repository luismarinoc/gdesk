'use client'

import { useEffect, useState } from 'react'
import { ADMIN_LIST_KEY } from '@/hooks/useTickets'

type ClickUpList = { id: string; name: string }

interface Props {
  onSelect: (listId: string, listName: string) => void
}

export function AdminListSelector({ onSelect }: Props) {
  const [lists, setLists] = useState<ClickUpList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clickup/lists')
      .then(r => r.json())
      .then(d => setLists(d.lists ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(list: ClickUpList) {
    localStorage.setItem(ADMIN_LIST_KEY, JSON.stringify({ id: list.id, name: list.name }))
    onSelect(list.id, list.name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">¿Qué lista quieres ver?</h2>
          <p className="text-sm text-gray-500 mt-1">Selecciona la lista de ClickUp para filtrar los tickets</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => handleSelect(list)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-100 hover:border-[#1B3A6B] hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 group-hover:bg-[#1B3A6B] transition-colors" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-[#1B3A6B]">{list.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
