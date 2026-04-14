// src/app/[locale]/(dashboard)/tickets/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { TicketDetail } from '@/components/tickets/TicketDetail'
import type { GDeskTicket } from '@/types'

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<GDeskTicket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clickup/tickets/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.ticket) {
          setTicket({
            ...data.ticket,
            createdAt: new Date(data.ticket.createdAt),
            updatedAt: new Date(data.ticket.updatedAt),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return <TicketDetail ticket={ticket} loading={loading} />
}
