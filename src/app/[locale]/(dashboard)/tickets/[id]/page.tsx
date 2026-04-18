// src/app/[locale]/(dashboard)/tickets/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { TicketDetail } from '@/components/tickets/TicketDetail'
import type { GDeskTicket } from '@/types'

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [ticket, setTicket] = useState<GDeskTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/clickup/tickets/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load ticket')
        return r.json()
      })
      .then(data => {
        if (data.ticket) {
          setTicket({
            ...data.ticket,
            createdAt: new Date(data.ticket.createdAt),
            updatedAt: new Date(data.ticket.updatedAt),
            attachments: (data.ticket.attachments ?? []).map((a: { uploadedAt: string } & Record<string, unknown>) => ({
              ...a,
              uploadedAt: new Date(a.uploadedAt),
            })),
          })
        }
      })
      .catch(err => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load ticket')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (fetchError) return <p className="text-red-500">{fetchError}</p>

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B3A6B] transition-colors w-fit flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </button>
      <TicketDetail ticket={ticket} loading={loading} />
    </div>
  )
}
