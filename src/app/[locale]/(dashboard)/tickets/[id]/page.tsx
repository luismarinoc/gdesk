// src/app/[locale]/(dashboard)/tickets/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { TicketDetail } from '@/components/tickets/TicketDetail'
import type { GDeskTicket } from '@/types'

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
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
          })
        }
      })
      .catch(err => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load ticket')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (fetchError) return <p className="text-red-500">{fetchError}</p>
  return <TicketDetail ticket={ticket} loading={loading} />
}
